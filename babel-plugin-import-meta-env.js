/**
 * Babel plugin to transform import.meta.env to process.env
 * This fixes the "Cannot use 'import.meta' outside a module" error
 * when bundling with Metro for web.
 */
module.exports = function () {
  return {
    name: 'transform-import-meta-env',
    visitor: {
      MetaProperty(path) {
        const { node } = path;
        // Check if it's import.meta
        if (node.meta.name === 'import' && node.property.name === 'meta') {
          const parent = path.parentPath;
          // Check if it's import.meta.env
          if (
            parent.isMemberExpression() &&
            parent.node.property.name === 'env'
          ) {
            const grandParent = parent.parentPath;
            // Check if it's import.meta.env.MODE or similar
            if (
              grandParent.isMemberExpression() &&
              grandParent.node.property.name
            ) {
              const envVar = grandParent.node.property.name;
              // Replace with process.env.VARIABLE
              grandParent.replaceWithSourceString(
                `(typeof process !== 'undefined' && process.env && process.env.${envVar})`
              );
            } else {
              // Replace import.meta.env with process.env
              parent.replaceWithSourceString(
                `(typeof process !== 'undefined' ? process.env : {})`
              );
            }
          }
        }
      },
    },
  };
};
