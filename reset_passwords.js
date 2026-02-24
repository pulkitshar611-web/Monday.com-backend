const bcrypt = require('bcryptjs');
const { User, sequelize } = require('./models');

const updatePasswords = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const newPassword = '123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        console.log('Updating all users with new hashed password...');

        const [affectedCount] = await User.update(
            { password: hashedPassword },
            { where: {} } // Empty where clause updates all records
        );

        console.log(`Successfully updated ${affectedCount} users.`);
        console.log(`All users can now login with password: ${newPassword}`);

    } catch (err) {
        console.error('Error updating passwords:', err);
    } finally {
        await sequelize.close();
    }
};

updatePasswords();
