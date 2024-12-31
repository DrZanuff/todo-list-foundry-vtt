/**
 * A single ToDo in our list of Todos.
 * @typedef {Object} ToDo
 * @property {string} id - A unique ID to identify this todo.
 * @property {string} label - The text of the todo.
 * @property {boolean} isDone - Marks whether the todo is done.
 * @property {string} userId - The user who owns this todo.
 */

class ToDoList {
  static ID = 'todo-list'

  static FLAGS = {
    TODOS: 'todos',
  }

  static TEMPLATES = {
    TODOLIST: `modules/${this.ID}/templates/todo-list.hbs`,
  }

  static log(force, ...args) {
    const shouldLog =
      force ||
      game.modules?.get('_dev-mode')?.api?.getPackageDebugValue(this.ID)

    if (shouldLog) {
      console.log(this.ID, '|', ...args)
    }
  }
}

/**
 * The data layer for our todo-list module
 */
class ToDoListData {
  /**
   * get all toDos for all users indexed by the todo's id
   */
  static get allToDos() {
    const allToDos = game.users.reduce((accumulator, user) => {
      const userTodos = this.getToDosForUser(user.id)

      return {
        ...accumulator,
        ...userTodos,
      }
    }, {})

    return allToDos
  }

  /**
   * Gets all of a given user's ToDos
   *
   * @param {string} userId - id of the user whose ToDos to return
   * @returns {Record<string, ToDo> | undefined}
   */

  static getToDosForUser(userId) {
    return game.users.get(userId)?.getFlag(ToDoList.ID, ToDoList.FLAGS.TODOS)
  }

  /**
   *
   * @param {string} userId - id of the user to add this ToDo to
   * @param {Partial<ToDo>} toDoData - the ToDo data to use
   */
  static createTodo(userId, toDoData) {
    const newToDo = {
      isDone: false,
      ...toDoData,
      id: foundry.utils.randomID(16),
      userId,
    }

    // construct the update to insert the new ToDo
    const newToDos = {
      [newToDo.id]: newToDo,
    }

    return game.users
      .get(userId)
      ?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, newToDos)
  }

  /**
   * Updates a given ToDo with the provided data.
   *
   * @param {string} toDoId - id of the ToDo to update
   * @param {Partial<ToDo>} updateData - changes to be persisted
   */
  static updateToDo(toDoId, updateData) {
    const relevantToDo = this.allToDos[toDoId]
    const all = this.allToDos

    // construct the update to send
    const update = {
      [toDoId]: updateData,
    }

    console.log('DBG: relevantToDo', { relevantToDo, all, toDoId })

    // update the database with the updated ToDo list
    return game.users
      .get(relevantToDo?.userId)
      ?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, update)
  }

  /**
   * Deletes a given ToDo
   *
   * @param {string} toDoId - id of the ToDo to delete
   */
  static deleteToDo(toDoId) {
    const relevantToDo = this.allToDos[toDoId]

    // Foundry specific syntax required to delete a key from a persisted object in the database
    // const keyDeletion = {
    //   [`-=${toDoId}`]: null
    // }
    // update the database with the updated ToDo list
    // return game.users.get(relevantToDo.userId)?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, keyDeletion);

    // I'll user the other syntax of `todos.${toDoId}`
    return game.users
      .get(relevantToDo?.userId)
      ?.unsetFlag(ToDoList.ID, `${ToDoList.FLAGS.TODOS}.${toDoId}`)
  }

  /**
   * Updates the given user's ToDos with the provided updateData. This is
   * useful for updating a single user's ToDos in bulk.
   *
   * @param {string} userId - user whose todos we are updating
   * @param {object} updateData - data passed to setFlag
   * @returns
   */
  static updateUserToDos(userId, updateData) {
    return game.users
      .get(userId)
      ?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, updateData)
  }
}

class ToDoListConfig extends FormApplication {
  static get defaultOptions() {
    const defaults = super.defaultOptions

    const overrides = {
      height: 'auto',
      id: 'todo-list',
      template: ToDoList.TEMPLATES.TODOLIST,
      title: 'To Do List',
      userId: game.userId,
    }

    const mergedOptions = foundry.utils.mergeObject(defaults, overrides)

    return mergedOptions
  }

  getData(options) {
    return {
      todos: ToDoListData.getToDosForUser(options.userId),
    }
  }
}

Hooks.on('ready', () => {
  // Create
  // ToDoListData.createTodo(game.userId, { label: `Assistir Vikings` })

  // Update
  // ToDoListData.updateToDo('todoId', {
  //   label: 'My Better Todo!',
  // })

  // Delete
  // ToDoListData.deleteToDo('todoId')

  console.log(
    'DBG: This code runs once core initialization is ready and game data is available.',
    ToDoListData.allToDos
  )
})

Hooks.on('renderPlayerList', (_, html) => {
  html.on('click', '.todo-list-icon-button', (_) => {
    console.log(ToDoListData.allToDos)
  })

  const loggedInUserListItem = html.find(`[data-user-id="${game?.userId}"]`)
  const tooltip = game.i18n.localize('TODO_LIST.buttonTitle')

  loggedInUserListItem.append(
    /*html*/
    `
      <button
        type='button'
        class='todo-list-icon-button flex0'
        title='${tooltip}'
      >
        <i class='fas fa-tasks'></i>
      </button>
    `
  )
})
