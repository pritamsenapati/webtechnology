$(function () {
    const $searchForm = $('#searchForm');
    const $searchInput = $('#searchInput');
    const $loadBooks = $('#loadBooks');
    const $bookList = $('#bookList');
    const $statusMessage = $('#statusMessage');

    function setLoading(isLoading) {
        $loadBooks.prop('disabled', isLoading);
        $loadBooks.find('.button-label').text(isLoading ? 'Searching…' : 'Find a book');
        $statusMessage.text(isLoading ? 'Searching Open Library…' : '');
        $bookList.empty();
    }

    function displayBooks(books) {
        $bookList.empty();

        if (books.length === 0) {
            $statusMessage.text('No books found. Try a different search.');
            return;
        }

        $.each(books, function (index, book) {
            const title = book.title || 'Untitled';
            const author = book.author_name ? book.author_name.join(', ') : 'Author unknown';
            const year = book.first_publish_year || 'Publication year unknown';
            const $card = $('<article>').addClass('book-card');
            const $cover = $('<div>').addClass('book-cover');

            if (book.cover_i) {
                $('<img>')
                    .attr({
                        src: 'https://covers.openlibrary.org/b/id/' + book.cover_i + '-M.jpg',
                        alt: 'Cover of ' + title,
                        loading: 'lazy'
                    })
                    .appendTo($cover);
            } else {
                $cover.addClass('cover-placeholder').text('No cover available');
            }

            $('<h2>').text(title).appendTo($card);
            $('<p>').addClass('book-author').text('By ' + author).appendTo($card);
            $('<p>').addClass('book-year').text('First published: ' + year).appendTo($card);

            if (book.key) {
                $('<a>')
                    .addClass('book-link')
                    .attr({
                        href: 'https://openlibrary.org' + book.key,
                        target: '_blank',
                        rel: 'noopener noreferrer'
                    })
                    .text('View book')
                    .appendTo($card);
            }

            $('<div>').addClass('cover-wrap').append($cover).prependTo($card);
            $bookList.append($card);
        });

        $statusMessage.text('Showing ' + books.length + ' book' + (books.length === 1 ? '' : 's') + '.');
    }

    $searchForm.on('submit', function (event) {
        event.preventDefault();
        const query = $searchInput.val().trim();

        if (!query) {
            $statusMessage.text('Enter a title, author, or subject to search.');
            $searchInput.trigger('focus');
            return;
        }

        setLoading(true);

        $.ajax({
            url: 'https://openlibrary.org/search.json',
            method: 'GET',
            dataType: 'json',
            data: {
                q: query,
                limit: 12,
                fields: 'key,title,author_name,first_publish_year,cover_i'
            }
        })
            .done(function (response) {
                displayBooks(response.docs || []);
            })
            .fail(function () {
                $bookList.empty();
                $statusMessage.text('Could not load books. Check your connection and try again.');
            })
            .always(function () {
                $loadBooks.prop('disabled', false);
                $loadBooks.find('.button-label').text('Find a book');
            });
    });

    $('.search-suggestion').on('click', function () {
        $searchInput.val($(this).data('query'));
        $searchForm.trigger('submit');
    });

    $searchForm.trigger('submit');
});
