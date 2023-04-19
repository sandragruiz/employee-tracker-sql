// Packages
const inquirer = require('inquirer');
const connection = require('./connection');
const cTable = require('console.table');

// Functions

// View all departments
function viewDepartments() {
    connection.query('SELECT * FROM departments', (err, res) => {
      if (err) throw err;
      console.table(res);
      mainMenu();
    });
  }
  
  // View all roles
  function viewRoles() {
    connection.query(`
      SELECT roles.id, roles.title, departments.name AS department, roles.salary
      FROM roles
      INNER JOIN departments ON roles.department_id = departments.id
    `, (err, res) => {
      if (err) throw err;
      console.table(res);
      mainMenu();
    });
  }
  
  // View all employees
  function viewEmployees() {
    connection.query(`
      SELECT
        employees.id,
        employees.first_name,
        employees.last_name,
        roles.title AS job_title,
        departments.name AS department,
        roles.salary,
        CONCAT(managers.first_name, ' ', managers.last_name) AS manager
      FROM employees
      INNER JOIN roles ON employees.role_id = roles.id
      INNER JOIN departments ON roles.department_id = departments.id
      LEFT JOIN employees managers ON employees.manager_id = managers.id
    `, (err, res) => {
      if (err) throw err;
      console.table(res);
      mainMenu();
    });
  }
  
  // Add a department
  function addDepartment() {
    inquirer
      .prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Enter the name of the department:',
          validate: input => input.trim() !== ''
        }
      ])
      .then(answer => {
        connection.query('INSERT INTO departments SET ?', answer, (err, res) => {
          if (err) throw err;
          console.log(`${res.affectedRows} department added!\n`);
          mainMenu();
        });
      });
  }
  
  // Add a role
  function addRole() {
    connection.query('SELECT * FROM departments', (err, res) => {
      if (err) throw err;
  
      inquirer
        .prompt([
          {
            type: 'input',
            name: 'title',
            message: 'Enter the title of the role:',
            validate: input => input.trim() !== ''
          },
          {
            type: 'number',
            name: 'salary',
            message: 'Enter the salary for the role:',
            validate: input => input > 0
          },
          {
            type: 'list',
            name: 'department_id',
            message: 'Select the department for the role:',
            choices: res.map(department => ({
              name: department.name,
              value: department.id
            }))
          }
        ])
        .then(answer => {
          connection.query('INSERT INTO roles SET ?', answer, (err, res) => {
            if (err) throw err;
            console.log(`${res.affectedRows} role added!\n`);
            mainMenu();
          });
        });
    });
  }
  
  // Add an employee
function addEmployee() {
    connection.query('SELECT * FROM roles', (err, res) => {
      if (err) throw err;
  
      inquirer
        .prompt([
          {
            type: 'input',
            name: 'first_name',
            message: 'Enter the first name of the employee:',
            validate: input => input.trim() !== ''
          },
          {
            type: 'input',
            name: 'last_name',
            message: 'Enter the last name of the employee:',
            validate: input => input.trim() !== ''
          },
          {
            type: 'list',
            name: 'role_id',
            message: 'Select the role for the employee:',
            choices: res.map(role => ({
              name: role.title,
              value: role.id
            }))
          },
          {
            type: 'list',
            name: 'manager_id',
            message: 'Select the manager for the employee:',
            choices: () => {
              return new Promise((resolve, reject) => {
                connection.query(`
                  SELECT id, CONCAT(first_name, ' ', last_name) AS name
                  FROM employees
                `, (err, res) => {
                  if (err) reject(err);
                  resolve(res.map(employee => ({
                    name: employee.name,
                    value: employee.id
                  })));
                });
              });
            }
          }
        ])
        .then(answer => {
          connection.query('INSERT INTO employees SET ?', answer, (err, res) => {
            if (err) throw err;
            console.log(`${res.affectedRows} employee added!\n`);
            mainMenu();
          });
        });
    });
  }
  
  // Update an employee's role
  function updateEmployeeRole() {
    connection.query('SELECT * FROM employees', (err, res) => {
      if (err) throw err;
  
      inquirer
        .prompt([
          {
            type: 'list',
            name: 'employee_id',
            message: 'Select the employee to update:',
            choices: res.map(employee => ({
              name: `${employee.first_name} ${employee.last_name}`,
              value: employee.id
            }))
          }
        ])
        .then(employeeAnswer => {
          connection.query('SELECT * FROM roles', (err, res) => {
            if (err) throw err;
  
            inquirer
              .prompt([
                {
                  type: 'list',
                  name: 'role_id',
                  message: 'Select the new role for the employee:',
                  choices: res.map(role => ({
                    name: role.title,
                    value: role.id
                  }))
                }
              ])
              .then(roleAnswer => {
                connection.query(`
                  UPDATE employees
                  SET role_id = ?
                  WHERE id = ?
                `, [roleAnswer.role_id, employeeAnswer.employee_id], (err, res) => {
                  if (err) throw err;
                  console.log(`${res.affectedRows} employee updated!\n`);
                  mainMenu();
                });
              });
          });
        });
    });
  }
  
// Main menu
function mainMenu() {
    inquirer
      .prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            'View all departments',
            'View all roles',
            'View all employees',
            'Add a department',
            'Add a role',
            'Add an employee',
            'Update an employee role',
            'Exit'
          ]
        }
      ])
      .then(answer => {
        switch (answer.action) {
          case 'View all departments':
            viewDepartments();
            break;
          case 'View all roles':
            viewRoles();
            break;
          case 'View all employees':
            viewEmployees();
            break;
          case 'Add a department':
            addDepartment();
            break;
          case 'Add a role':
            addRole();
            break;
          case 'Add an employee':
            addEmployee();
            break;
          case 'Update an employee role':
            updateEmployeeRole();
            break;
          case 'Exit':
            console.log('Goodbye!');
            connection.end();
            process.exit(0);
        }
      });
  }
