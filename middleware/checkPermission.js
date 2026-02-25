module.exports = (permissionKey) => {
    return (req, res, next) => {
        // Requested by user: Everyone has full permissions like Admin
        return next();
    };
};
