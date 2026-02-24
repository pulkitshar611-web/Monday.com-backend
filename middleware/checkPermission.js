/**
 * Middleware to check for a specific permission key.
 * Admins always pass.
 * @param {string} permissionKey - The key to check in req.user.permissions
 */
module.exports = (permissionKey) => {
    return (req, res, next) => {
        const { role, permissions } = req.user;

        // Admins always have all permissions
        if (role === 'Admin') {
            return next();
        }

        if (permissions && permissions[permissionKey] === true) {
            return next();
        }

        return res.status(403).json({
            msg: `Access denied: Missing '${permissionKey}' permission`,
            code: 'PERMISSION_DENIED',
            requiredPermission: permissionKey
        });
    };
};
