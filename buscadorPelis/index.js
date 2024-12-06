let paginaActual = 1;
let busquedaActual = "";
let tipoBusqueda = "movie";
let dejarTiempo = null;
let peliculasGuardadas = [];

window.onload = () => {
    document.getElementById("cajatexto").addEventListener("input", () => {
        const nombreBusqueda = document.getElementById("cajatexto").value.trim();

        if (nombreBusqueda.length < 3) {
            return;
        }

        if (dejarTiempo) {
            clearTimeout(dejarTiempo);
        }

        dejarTiempo = setTimeout(() => {
            busquedaActual = nombreBusqueda;
            paginaActual = 1;
            peliculasGuardadas = [];
            buscarPeliculas(true);
        }, 500);
    });

    document.getElementById("btnPeliculas").addEventListener("click", () => {
        tipoBusqueda = "movie";
        realizarNuevaBusqueda();
    });

    document.getElementById("btnSeries").addEventListener("click", () => {
        tipoBusqueda = "series";
        realizarNuevaBusqueda();
    });

    document.querySelector("#detallesPelicula .cerrar").addEventListener("click", () => {
        document.getElementById("detallesPelicula").style.display = "none";
    });

    document.getElementById("crearInforme").addEventListener("click", () => {
        generarInforme();
    });

    document.querySelector("#informeContainer .cerrarInforme").addEventListener("click", () => {
        document.getElementById("informeContainer").style.display = "none";
    });

    window.addEventListener("scroll", () => {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10) {
            if (busquedaActual !== "") {
                paginaActual++;
                buscarPeliculas(false);
            }
        }
    });
};

function realizarNuevaBusqueda() {
    busquedaActual = document.getElementById("cajatexto").value.trim();
    if (busquedaActual.length >= 3) {
        paginaActual = 1;
        peliculasGuardadas = [];
        buscarPeliculas(true);
    }
}

function buscarPeliculas(limpiar) {
    fetch(`http://www.omdbapi.com/?apikey=3e25e1bb&s=${busquedaActual}&type=${tipoBusqueda}&page=${paginaActual}`, { method: "GET" })
        .then(res => res.json())
        .then(datosRecibidos => {
            if (datosRecibidos.Response === "False") {
                document.getElementById("resultados").innerHTML = "No se encontraron resultados.";
                return;
            }

            const contenedor = document.getElementById("resultados");
            if (limpiar || !contenedor.querySelector("ul")) {
                contenedor.innerHTML = ""; // Limpia los resultados anteriores
                const ul = document.createElement("ul");
                contenedor.appendChild(ul);
            }

            const ul = contenedor.querySelector("ul");

            datosRecibidos.Search.forEach((item) => {
                peliculasGuardadas.push(item.imdbID);
                const li = document.createElement("li");
                li.innerHTML = `
                    <div class="pelicula" data-imdbID="${item.imdbID}">
                        <img src="${item.Poster}" alt="${item.Title}">
                        <h3>${item.Title}</h3>
                        <p>${item.Year}</p>
                    </div>`;

                li.addEventListener("click", () => mostrarDetalles(item.imdbID));
                ul.appendChild(li);
            });

            if (paginaActual === 1) {
                document.getElementById("crearInforme").style.display = "block";
            }
        });
}

function mostrarDetalles(imdbID) {
    fetch(`http://www.omdbapi.com/?apikey=3e25e1bb&i=${imdbID}`, { method: "GET" })
        .then(res => res.json())
        .then(item => {
            document.getElementById("tituloPelicula").innerText = item.Title;
            document.getElementById("añoPelicula").innerText = `Año: ${item.Year}`;
            document.getElementById("directorPelicula").innerText = `Director: ${item.Director}`;
            document.getElementById("actoresPelicula").innerText = `Actores: ${item.Actors}`;
            document.getElementById("sinopsisPelicula").innerText = `Sinopsis: ${item.Plot}`;
            document.getElementById("detallesPelicula").style.display = "block";
        });
}

function generarInforme() {
    const informeContainer = document.getElementById("informeContainer");
    informeContainer.innerHTML = `
        <h2>Informe de Películas</h2>
        <p>Ver películas más valoradas por <b>imdbRating</b> (5), películas con mayor recaudación (5) o películas más votadas (5)</p>
        <div id='grafica'>
            <div id='chart_div'></div>
        </div>`;
    informeContainer.style.display = "block";

    const detallesPeliculas = Promise.all(
        peliculasGuardadas.map(id =>
            fetch(`http://www.omdbapi.com/?apikey=3e25e1bb&i=${id}`).then(res => res.json())
        )
    );

    detallesPeliculas.then(data => {
        const topRated = data.sort((a, b) => parseFloat(b.imdbRating) - parseFloat(a.imdbRating)).slice(0, 5);
        const topGrossing = data.sort((a, b) => parseInt(b.BoxOffice.replace(/\$|,/g, "")) - parseInt(a.BoxOffice.replace(/\$|,/g, ""))).slice(0, 5);
        const mostVoted = data.sort((a, b) => parseInt(b.imdbVotes.replace(/,/g, "")) - parseInt(a.imdbVotes.replace(/,/g, ""))).slice(0, 5);

        renderList(topRated, "Películas más valoradas", "imdbRating");
        renderList(topGrossing, "Películas más recaudadas", "BoxOffice");
        renderList(mostVoted, "Películas más votadas", "imdbVotes");

        renderChart(topRated, "Películas más valoradas", "imdbRating");
        renderChart(topGrossing, "Películas más recaudadas", "BoxOffice");
        renderChart(mostVoted, "Películas más votadas", "imdbVotes");
    });
}

function renderList(data, title, property) {
    const container = document.createElement("div");
    const header = document.createElement("h3");
    header.innerText = title;
    container.appendChild(header);

    const list = document.createElement("ul");
    data.forEach(item => {
        const li = document.createElement("li");
        li.innerText = `${item.Title} - ${item[property]}`;
        list.appendChild(li);
    });

    container.appendChild(list);
    document.getElementById("informeContainer").appendChild(container);
}

function renderChart(data, title, property) {
    const chartData = [["Película", title]];

    data.forEach(item => {
        let value;
        if (property === "BoxOffice") {
            value = parseInt(item.BoxOffice.replace(/\$|,/g, ""));
        } else if (property === "imdbVotes") {
            value = parseInt(item.imdbVotes.replace(/,/g, ""));
        } else {
            value = parseFloat(item[property]);
        }

        chartData.push([item.Title, value]);
    });

    google.charts.load("current", {
        packages: ["corechart", "bar"]
    });

    google.charts.setOnLoadCallback(() => {
        const dataTable = google.visualization.arrayToDataTable(chartData);
        const options = {
            title: title,
            chartArea: {
                width: "50%"
            },
            hAxis: {
                title: title,
                minValue: 0
            },
            vAxis: {
                title: "Películas"
            }
        };

        const chart = new google.visualization.BarChart(document.getElementById("chart_div"));
        chart.draw(dataTable, options);
    });
}
