// variable to hold the base URL for the API
const url = "http://localhost:3000";

// Fetch all movies from the server
async function fetchAllMovies() {
    const response = await fetch(`${url}/films`);
    // Check if the response is successful.(status code in the range 200-299)
    if (!response.ok) {
        throw new Error(`Failed to fetch movies: ${response.statusText}`);
    }
    //return the JSON-parsed response data  of the response
    return response.json();
}

// Fetch first movie data when the page loads
window.addEventListener("load", async () => {
    try {
        const movies = await fetchAllMovies();
        // Get the first movie from the movies array
        const firstMovie = movies[0];
        displayFirstMovieDetails(firstMovie);
        displayMovieMenu(movies);
    } catch (error) {
        console.error("Error fetching movie data:", error);// if there is an error it will be logged
    }
});

// Display movie details
function displayFirstMovieDetails(movie) {
    // Get the HTML elements that will be used to display the movie details
    const posterElement = document.querySelector("#poster");
    const titleElement = document.querySelector("#title");
    const runtimeElement = document.querySelector("#runtime");
    const showtimeElement = document.querySelector("#showtime");
    const ticketsSoldElement = document.querySelector("#ticket-num");
    const filmInfoElement = document.querySelector("#film-info");

    posterElement.src = movie.poster;//sets the poster image source

    titleElement.textContent = movie.title;
    titleElement.dataset.movieId = movie.id; // Set dataset attribute for movie ID
    
    runtimeElement.textContent = `${movie.runtime} minutes`;
    showtimeElement.textContent = movie.showtime;
    
    //Update ticket count display
    updateTicketCount(movie);

    //Display movie description
    filmInfoElement.textContent = movie.description;
}

// Display movie menu in the left sidebar
function displayMovieMenu(movies) {
    const filmsList = document.querySelector("#films");
    filmsList.innerHTML = ""; // Clear previous content

    movies.forEach(movie => {
        // Create list item for movie
        const listItem = document.createElement("li");
        listItem.textContent = movie.title;
        listItem.classList.add("movie-title"); // Add a class for easy selection

        // Create delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("delete-button");
        deleteButton.style.backgroundColor = "red";
        deleteButton.style.border = "1px solid red";

        

        // Append movie title and delete button to list item
        listItem.appendChild(deleteButton);

        // Append list item to films list
        filmsList.appendChild(listItem);

        // Event listener for delete button click
        deleteButton.addEventListener("click", async () => {
            deleteButton.style.backgroundColor = "white";
            
        
            try {
                await deleteFilm(movie.id);
                // After successful deletion, remove the movie from the UI
                alert("Movie successfully deleted");
                listItem.remove();
            } catch (error) {
                console.error("Error deleting movie:", error);
            }
        });

        // Event listener for movie title click
        listItem.addEventListener("click", async () => {
            try {
                const selectedMovie = await fetchMovieById(movie.id);
                displayFirstMovieDetails(selectedMovie);
            } catch (error) {
                console.error("Error fetching selected movie data:", error);
            }
        });
    });
}

// Fetch movie by ID
async function fetchMovieById(movieId) {
    const response = await fetch(`${url}/films/${movieId}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch movie: ${response.statusText}`); //handle errors
    }
    return response.json(); // Log errors
}

// Function to update tickets_sold on the server (PATCH request)
async function updateTicketsSold(movieId) {
    try {
        const movie = await fetchMovieById(movieId); //Get movie data first
        const updatedTicketSold = movie.tickets_sold + 1; // Increment the tickets_sold by 1
    
        const response = await fetch(`${url}/films/${movieId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tickets_sold: updatedTicketSold }) //Send updated tickets_sold
        });
        if (!response.ok) {
            throw new Error(`Error updating tickets sold: ${response.statusText}`); //Handle errors
        }
        updateTicketCount(movie); // Update ticket count display with the new value
    } catch (error) {
        console.error("Error updating tickets sold:", error); //Log errors
    }
}



// Function to create a ticket for a movie (POST request)
async function createTicket(movieId, updatedTicketSold) {
    try {
        const response = await fetch(`${url}/tickets/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ film_id: movieId, number_of_tickets: updatedTicketSold })
        });
        if (!response.ok) {
            throw new Error(`Error creating ticket: ${response.statusText}`);
        }
        // Handle successful ticket creation
        const ticketData = await response.json();
        console.log('Ticket successfully created:', ticketData);
        
    } catch (error) {
        console.error("Error creating ticket:", error);
    }
}

// Function to delete a film from the server (DELETE request)
async function deleteFilm(movieId) {
    try {
        const response = await fetch(`${url}/films/${movieId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`Error deleting film: ${response.statusText}`);
        }
        // Reload the page after successful deletion
        location.reload();
    } catch (error) {
        console.error("Error deleting film:", error);
    }
}
// Update ticket count display
function updateTicketCount(movie) {
    const ticketsSoldElement = document.querySelector("#ticket-num");
    const availableTickets = movie.capacity - movie.tickets_sold;

    //Display available tickets (handle negative values)
    ticketsSoldElement.textContent = availableTickets >= 0 ? availableTickets : 0;

    // Update buy ticket button state
    const buyTicketButton = document.querySelector("#buy-ticket");
    if (availableTickets <= 0) {
        buyTicketButton.textContent = "Sold Out";
        buyTicketButton.disabled = true; //Disable button if sold out
    } else {
        buyTicketButton.textContent = "Buy Ticket";
        buyTicketButton.disabled = false;
    }
}

// Event listener for buy ticket button click
document.querySelector("#buy-ticket").addEventListener("click", async () => {
    try {
        const selectedMovieId = document.querySelector("#title").dataset.movieId;
        const updatedTicketSold = parseInt(document.querySelector("#ticket-num").textContent) + 1;
        
        //update sever-side tickets_sold
        await updateTicketsSold(selectedMovieId, updatedTicketSold);

        //create ticket on server
        await createTicket(selectedMovieId, updatedTicketSold);
        

        //alert('Your ticket has been purchased!');
    } catch (error) {
        console.error("Error buying ticket:", error);
    }
});