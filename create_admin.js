const bcrypt = require('bcryptjs');
const { User, sequelize } = require('./models');

const createAdmin = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const email = 'admin@gmail.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        const [user, created] = await User.findOrCreate({
            where: { email },
            defaults: {
                name: 'System Admin',
                password: hashedPassword,
                role: 'Admin',
                status: 'active'
            }
        });

        if (created) {
            console.log('Admin user created successfully.');
        } else {
            console.log('Admin user already exists. Updating password...');
            user.password = hashedPassword;
            await user.save();
            console.log('Admin password updated to: password123');
        }

    } catch (err) {
        console.error('Error creating admin:', err);
    } finally {
        await sequelize.close();
    }
};

createAdmin();
