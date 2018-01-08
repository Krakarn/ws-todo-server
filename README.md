# ws-todo-server

Simple server application that allows a client to operate on/view a todo-list.

## Todo

- Implement support for pagination
  - Implement support for skip
  - Implement support for take

- Possible library for easier connection with sql or other databases
  (The way to do it now is to listen to events on the in-memory tables
  and hookup the needed calls for the different events.)
  - Setup a custom server that connects to an sql database and support the following
    operations:
    - List (list all items, support for pagination if implemented)
    - Create
    - Update
    - Delete
  - Create a translation service between lang-filter and sql
  - Use the translation service to apply the given filter when receiving a list request

- Setup benchmarking tools

- Extend tests to cover all parts of the core

- Implement support for middleware
  - When receiving requests or possibly doing other operations

- Implement basic, highly customizable middleware systems
  - Authentication
  - Permissions

## Example Web Application System

### Accounts and Users

- Able to register accounts
- Able to register users within accounts
- Each user is able to login/logout
  - Able to create session given the correct credentials
- Able to set permissions on users
- Actions may be permitted/denied based on user permissions
- Able to view all users inside the account

### User Groups

- Able to create user groups
- Able to assign/remove users to/from a user group

### Tasks

- Each user is able to create tasks
- Able to assign tasks to either a user, user group or another task (becoming a subtask)
- Able to check off a task as completed
- Able to comment on a task
