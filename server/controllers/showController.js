import axios from "axios";
import Movie from "../model/Movie.js";
import Show from "../model/Show.js";

export const getNowPlayingMovies = async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://api.themoviedb.org/3/movie/now_playing",
      {
        headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
      }
    );

    const movies = data.results;
    res.json({ success: true, movies: movies });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const addShow = async (req, res) => {
  try {
    const { movieId, showsInput, showPrice } = req.body;

    let movie = await Movie.findById(movieId);

    if (!movie) {
      const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
        }),

        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
        }),
      ]);

      const movieApiData = movieDetailsResponse.data;
      const movieCreditsData = movieCreditsResponse.data;

      const movieDetails = {
        _id: movieId,
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        genres: movieApiData.genres,
        casts: movieCreditsData.cast,
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || "",
        vote_average: movieApiData.vote_average,
        runtime: movieApiData.runtime,
      };

      movie = await Movie.create(movieDetails);
    }

    const showsToCreate = [];
    showsInput.forEach((show) => {
      const showDate = show.date;
      show.time.forEach((time) => {
        const dateTimeString = `${showDate}T${time}`;
        showsToCreate.push({
          movie: movieId,
          showDateTime: new Date(dateTimeString),
          showPrice,
          occupiedSeats: {},
        });
      });
    });

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
    }
    res.json({ success: true, message: "Show Added successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const getShows = async (req, res) => {
  try {
    // First try: upcoming shows only
    let shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate("movie")
      .sort({ showDateTime: 1 });

    // If no upcoming shows are found, fall back to returning any shows
    if (!shows || shows.length === 0) {
      shows = await Show.find() // return all shows as fallback
        .populate("movie")
        .sort({ showDateTime: 1 });
    }

    // Build unique list of movies keyed by movie _id to avoid issues when
    // deduping populated Mongoose documents with Set.
    const moviesById = {};
    shows.forEach((show) => {
      const movie = show.movie;
      if (movie && movie._id) {
        moviesById[movie._id] = movie;
      }
    });

    const uniqueMovies = Object.values(moviesById);

    // Also include any movies that exist in the Movie collection but
    // currently have no upcoming shows (so the client sees all movies).
    const existingMovieIds = uniqueMovies.map((m) => String(m._id));
    const otherMovies = await Movie.find({ _id: { $nin: existingMovieIds } });

    const allMovies = uniqueMovies.concat(otherMovies);
    res.json({ success: true, shows: allMovies });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;
    // Try upcoming shows first
    let shows = await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() },
    }).sort({ showDateTime: 1 });

    // Fallback: if no upcoming shows, return any shows for the movie
    if (!shows || shows.length === 0) {
      shows = await Show.find({ movie: movieId }).sort({ showDateTime: 1 });
    }

    const movie = await Movie.findById(movieId);
    const dateTime = {};

    shows.forEach((show) => {
      if (!show || !show.showDateTime) return;
      const d =
        show.showDateTime instanceof Date
          ? show.showDateTime
          : new Date(show.showDateTime);
      const date = d.toISOString().split("T")[0];
      if (!dateTime[date]) {
        dateTime[date] = [];
      }
      dateTime[date].push({ time: d.toISOString(), showId: show._id });
    });

    res.json({ success: true, movie, dateTime });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
