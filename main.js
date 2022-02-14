document.addEventListener('DOMContentLoaded', main)

/**
 * Main function
 */
function main() {
    const bookInputForm = getBookInputForm()
    const searchForm = getSearchForm()

    // Restore books from storage
    renderBookShelfElements(BookStorage.getAll())

    // Add onsubmit event listener to form input book
    bookInputForm.container.addEventListener('submit', (e) => {
        e.preventDefault()
        if (!bookInputForm.inputBookId.value) {
            const book = generateBookTemplate()
            book.title = bookInputForm.inputTitle.value
            book.author = bookInputForm.inputAuthor.value
            book.year = bookInputForm.inputYear.value
            book.isComplete = bookInputForm.checkBoxIsComplete.checked
            BookStorage.set(book)
            renderBookShelfElements(BookStorage.getAll())
            bookInputForm.container.reset()
        }
    })    

    // Toogle text submit button based on input book is complete read field
    bookInputForm.checkBoxIsComplete.addEventListener('change', (e) => {
        const submitSpanText = bookInputForm.buttonSubmit.querySelector('span')
        if (e.target.checked) {
            submitSpanText.innerText = 'Selesai dibaca'
        } else {
            submitSpanText.innerHTML = 'Belum selesai dibaca'
        }
    })

    // Search book by title when user submit search form
    searchForm.container.addEventListener('submit', (e) => {
        e.preventDefault()
        const searchInput = searchForm.inputQuery
        const searchResult = BookStorage.getAll({ name: searchInput.value })
        renderBookShelfElements(searchResult)
    })
}

const BookStorage = {
    _books: [],
    _STORAGE_KEY: 'BOOKS_STORAGE',

    /**
     * Get all book data from storage with optional filter
     * @param {*} filter
     * @returns
     */
    getAll:  function({ name } = {}) {
        if (isStorageExists()) {
            const storageData = localStorage.getItem(this._STORAGE_KEY)
            this._books = JSON.parse(storageData) || []
        }

        if (name) {
            return this._books.filter(book => book.title.toLowerCase().includes(name.toLowerCase()))
        }
        
        return this._books
    },

    /**
     * Add book to local storage or update if exists
     * @param {*} book
     * @param {string} book.id
     * @param {string} book.title
     * @param {string} book.author
     * @param {number} book.year
     * @param {boolean} book.isComplete
     */
    set: function(book) {
        const books = this.getAll()
        const isBookExists = books.find(b => b.id === book.id)

        if (isBookExists) {
            const index = books.findIndex(b => b.id === book.id)
            books[index] = book
        } else {
            this._books.push(book)
        }

        if (isStorageExists()) {
            localStorage.setItem(this._STORAGE_KEY, JSON.stringify(this._books))
        }
    },

    /**
     * Delete book from local storage
     * @param {string} id 
     */
    delete: function(id) {
        this._books = this._books.filter(book => book.id !== id)
        if (isStorageExists()) {
            localStorage.setItem(this._STORAGE_KEY, JSON.stringify(this._books))
        }
    }
}

/**
 * Generate book template data
 * @returns
 */
function generateBookTemplate() {
    return {
        id: +new Date(),
        title: '',
        author: '',
        year: 0,
        isComplete: false
    }
}

/**
 * Check is browser support localStorage
 */
function isStorageExists() {
    if (typeof Storage !== 'undefined') {
        return true
    }
    console.log('This browser does not support local storage')
    return false
}

/**
 * Get DOM element of book input form
 * @returns
 */
function getBookInputForm() {
    return {
        container: document.querySelector('#inputBook'),
        inputBookId: document.querySelector('#inputBookId'),
        inputTitle: document.querySelector('#inputBookTitle'),
        inputAuthor: document.querySelector('#inputBookAuthor'),
        inputYear: document.querySelector('#inputBookYear'),
        checkBoxIsComplete: document.querySelector('#inputBookIsComplete'),
        buttonSubmit: document.querySelector('#bookSubmit')
    }
}

/**
 * Get DOM element of search form
 * @returns
 */
function getSearchForm() {
    return {
        container: document.querySelector('#searchBook'),
        inputQuery: document.querySelector('#searchBookTitle')
    }
}

/**
 * Generate bookshelf DOM element
 * @param {*} book
 * @returns
 */
function generateBookshelfElement(book) {
    const container = document.createElement('article')
    const heading = document.createElement('h3')
    const author = document.createElement('p')
    const year = document.createElement('p')
    const action = document.createElement('div')
    const completeButton = document.createElement('button')
    const editButton = document.createElement('button')
    const deleteButton = document.createElement('button')
    
    container.classList.add('book_item')
    action.classList.add('action')
    completeButton.classList.add('green')
    editButton.classList.add('gray')
    deleteButton.classList.add('red')

    heading.innerText = book.title
    author.innerText = `Penulis: ${book.author}`
    year.innerText = `Tahun: ${book.year}`
    if (book.isComplete) {
        completeButton.innerText = 'Belum selesai dibaca'
    } else {
        completeButton.innerText = 'Selesai dibaca'
    }
    editButton.innerText = 'Edit buku'
    deleteButton.innerText = 'Hapus buku'

    // Move to complete when user click complete button or vice versa
    completeButton.onclick = () => {
        book.isComplete = !book.isComplete
        BookStorage.set(book)
        renderBookShelfElements(BookStorage.getAll())
    }

    // Edit book when user click edit button
    editButton.onclick = () => {
        const bookInputForm = getBookInputForm()
        bookInputForm.inputBookId.value = book.id
        bookInputForm.inputTitle.value = book.title
        bookInputForm.inputAuthor.value = book.author
        bookInputForm.inputYear.value = book.year
        bookInputForm.checkBoxIsComplete.checked = book.isComplete
        bookInputForm.checkBoxIsComplete.dispatchEvent(new Event('change'))
        window.scrollTo(0, 0)

        const performEdit = (e) => {
            e.preventDefault()
            if (bookInputForm.inputBookId.value) {
                const book = generateBookTemplate()
                book.id = Number(bookInputForm.inputBookId.value)
                book.title = bookInputForm.inputTitle.value
                book.author = bookInputForm.inputAuthor.value
                book.year = bookInputForm.inputYear.value
                book.isComplete = bookInputForm.checkBoxIsComplete.checked

                BookStorage.set(book)
                renderBookShelfElements(BookStorage.getAll())
                bookInputForm.container.reset()
                bookInputForm.inputBookId.value = ''
            }
            bookInputForm.container.removeEventListener('submit', performEdit)
        }

        bookInputForm.container.addEventListener('submit', performEdit)
    }

    // Delete book from storage and DOM when user agree dialog box
    deleteButton.onclick = () => {
        const bookInputForm = getBookInputForm()
        bookInputForm.inputBookId.value = ''
        bookInputForm.container.reset()
        
        DialogDeleteBook.show()
        DialogDeleteBook.observeResponse((response) => {
            if (response) {
                BookStorage.delete(book.id)
                renderBookShelfElements(BookStorage.getAll())
            }
        })
    }

    action.append(completeButton, editButton, deleteButton)
    container.append(heading, author, year, action)
    return container
}

/**
 * Render bookshelf elements to DOM
 * @param {Object[]} books 
 */
function renderBookShelfElements(books) {
    const completeListContainer = document.querySelector('#completeBookshelfList')
    const incompleteListContainer = document.querySelector('#incompleteBookshelfList')

    // Remove all child nodes from complete list
    while (completeListContainer.hasChildNodes()) {
        completeListContainer.removeChild(completeListContainer.firstChild)
    }
    
    // Remove all child nodes from incomplete list
    while (incompleteListContainer.hasChildNodes()) {
        incompleteListContainer.removeChild(incompleteListContainer.firstChild)
    }

    // Render complete and incomplete element list
    books.forEach(book => {
        if (book.isComplete) {
            completeListContainer.append(generateBookshelfElement(book))
        } else {
            incompleteListContainer.append(generateBookshelfElement(book))
        }
    });
}

const DialogDeleteBook = { 
    _container: document.querySelector('#dialogDeleteBook'),

    /**
     * Show dialog box to screen
     */
    show: function() {
        this._container.classList.add('show')
    },

    /**
     * Hide dialog box from screen
     */
    hide: function() {
        this._container.classList.remove('show')
    },

    /**
     * Observe dialog box response
     * @param {void} callback
     */
     observeResponse: function(callback) {
        const buttonConfirm = this._container.querySelector('.button_confirm')
        const buttonCancel = this._container.querySelector('.button_cancel')
        
        buttonConfirm.onclick = () => {
            callback(true)
            this.hide()
        }

        buttonCancel.onclick = () => {
            callback(false)
            this.hide()
        }
    },
}