require('dotenv').config();
const { Board, Group, Item, sequelize } = require('./models');

const seedPayroll = async () => {
    try {
        await sequelize.sync();

        const [board] = await Board.findOrCreate({
            where: { name: 'Payroll Management' },
            defaults: {
                type: 'board',
                folder: 'PayRoll', // PayRoll folder as requested
                workspace: 'Main Workspace',
                columns: [
                    { id: 'name', title: 'Employee Name', type: 'person' },
                    { id: 'emp_id', title: 'Employee ID', type: 'text' },
                    {
                        id: 'role', title: 'Role', type: 'status', options: [
                            { label: 'Developer', color: '#0085ff' },
                            { label: 'HR', color: '#fdab3d' },
                            { label: 'Manager', color: '#00c875' }
                        ]
                    },
                    {
                        id: 'department', title: 'Department', type: 'status', options: [
                            { label: 'IT', color: '#a25ddc' },
                            { label: 'HR', color: '#fdab3d' },
                            { label: 'Sales', color: '#e2445c' }
                        ]
                    },
                    { id: 'total_days', title: 'Total Working Days', type: 'number' },
                    { id: 'present_days', title: 'Present Days', type: 'number' },
                    { id: 'leave_days', title: 'Leave Days', type: 'number' },
                    { id: 'overtime_hours', title: 'Overtime Hours', type: 'number' },
                    { id: 'total_worked_hours', title: 'Total Worked Hours', type: 'number' },
                    { id: 'basic_salary', title: 'Basic Salary', type: 'currency' },
                    { id: 'per_day_salary', title: 'Per Day Salary', type: 'formula', formula: '{basic_salary} / {total_days}' },
                    { id: 'leave_deduction', title: 'Leave Deduction', type: 'formula', formula: '{leave_days} * ({basic_salary} / {total_days})' },
                    { id: 'overtime_rate', title: 'Overtime Rate', type: 'currency' },
                    { id: 'overtime_pay', title: 'Overtime Pay', type: 'formula', formula: '{overtime_hours} * {overtime_rate}' },
                    { id: 'gross_salary', title: 'Gross Salary', type: 'formula', formula: '{basic_salary} + ({overtime_hours} * {overtime_rate})' },
                    { id: 'total_deduction', title: 'Total Deduction', type: 'formula', formula: '{leave_days} * ({basic_salary} / {total_days})' },
                    { id: 'net_payable', title: 'Net Payable Salary', type: 'formula', formula: '({basic_salary} + ({overtime_hours} * {overtime_rate})) - ({leave_days} * ({basic_salary} / {total_days}))' },
                    {
                        id: 'payment_status', title: 'Payment Status', type: 'status', options: [
                            { label: 'Pending', color: '#fdab3d' },
                            { label: 'Approved', color: '#0085ff' },
                            { label: 'Paid', color: '#00c875' }
                        ]
                    },
                    { id: 'payment_date', title: 'Payment Date', type: 'date' },
                    { id: 'remarks', title: 'Remarks', type: 'text' },
                    // Advanced Features
                    { id: 'perf_bonus', title: 'Performance Bonus', type: 'currency' },
                    { id: 'fest_bonus', title: 'Festival Bonus', type: 'currency' },
                    { id: 'tds_percent', title: 'TDS %', type: 'number' },
                    { id: 'tax_deduction', title: 'Tax Deduction', type: 'formula', formula: '( ({basic_salary} + ({overtime_hours} * {overtime_rate})) - ({leave_days} * ({basic_salary} / {total_days})) ) * ({tds_percent} / 100)' }
                ]
            }
        });

        const [group] = await Group.findOrCreate({
            where: { title: 'October 2024 Payroll', BoardId: board.id },
            defaults: { color: '#0085ff' }
        });

        await Item.findOrCreate({
            where: { name: 'John Doe', GroupId: group.id },
            defaults: {
                customFields: {
                    emp_id: 'EMP-001',
                    role: 'Developer',
                    department: 'IT',
                    total_days: 22,
                    present_days: 20,
                    leave_days: 2,
                    overtime_hours: 10,
                    total_worked_hours: 170,
                    basic_salary: 5000,
                    overtime_rate: 20,
                    payment_status: 'Pending',
                    perf_bonus: 200,
                    fest_bonus: 0,
                    tds_percent: 5
                }
            }
        });

        console.log('Payroll board seeded successfully!');
    } catch (err) {
        console.error('Error seeding payroll board:', err);
    } finally {
        process.exit();
    }
};

seedPayroll();
