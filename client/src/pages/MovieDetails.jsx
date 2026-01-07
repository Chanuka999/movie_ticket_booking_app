import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Heart, PlayCircleIcon, StarIcon } from "lucide-react";
import BlurCircle from "../components/BlurCircle";
import timeFormat from "../lib/timeFormat.js";
import Dateselect from "../components/Dateselect.jsx";
import MovieCard from "../components/MovieCard.jsx";
import Loading from "../components/Loading.jsx";
import { useAppContext } from "../context/AppContext.jsx";
import toast from "react-hot-toast";

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [castImagesLoaded, setCastImagesLoaded] = useState({});

  const {
    shows,
    axios,
    getToken,
    user,
    fetchFavouriteMovies,
    favouriteMovies,
    image_base_url,
  } = useAppContext();

  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`);
      if (data.success) {
        setShow(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleFavourite = async () => {
    try {
      if (!user) return toast.error("please login to proceed");

      const { data } = await axios.post(
        "/api/user/update-favorite",
        { movieId: id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        await fetchFavouriteMovies();
        toast.success(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getShow();
  }, [id]);

  return show ? (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <div className="relative max-md:mx-auto rounded-xl h-104 max-w-70 overflow-hidden">
          {!posterLoaded && (
            <div className="absolute inset-0 bg-gray-700 animate-pulse" />
          )}
          <img
            src={
              image_base_url.replace("/w500", "/w780") + show.movie.poster_path
            }
            srcSet={`${image_base_url + show.movie.poster_path} 500w, ${
              image_base_url.replace("/w500", "/w780") + show.movie.poster_path
            } 780w`}
            sizes="(max-width: 768px) 500px, 780px"
            alt={show.movie.title}
            loading="eager"
            onLoad={() => setPosterLoaded(true)}
            className={`rounded-xl h-104 max-w-70 object-cover transition-opacity duration-300 ${
              posterLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />
          <p className="text-primary">ENGLISH</p>
          <h1 className="text-4xl font-semibold max-w-96 text-balance">
            {show.movie.title}
          </h1>
          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            {show.movie.vote_average.toFixed(1)} User Rating
          </div>
          <p className="text-gray-400 mt-2 text-sm leading-tight max-w-xl">
            {show.movie.overview}
          </p>

          <p>
            {timeFormat(show.movie.runtime)} .{" "}
            {show.movie.genres.map((genre) => genre.name).join(", ")} .{" "}
            {show.movie.release_date
              ? String(show.movie.release_date).split("-")[0]
              : ""}{" "}
          </p>

          <div className="flex items-center flex-wrap gap-4 mt-4">
            <button className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-primary-dull transition rounded-md font-medium cursor-pointer active:scale-95">
              <PlayCircleIcon />
              Watch Trailer
            </button>
            <a
              href="#dateSelect"
              className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer active:scale-95"
            >
              Buy Tickets
            </a>
            <button
              onClick={handleFavourite}
              className="bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95"
            >
              {(() => {
                const isFav = (favouriteMovies || []).find(
                  (m) => String(m._id) === String(id)
                );
                const extra = isFav ? "text-primary fill-primary" : "";
                return <Heart className={`w-5 h-5 ${extra}`} />;
              })()}
            </button>
          </div>
        </div>
      </div>

      <p className="text-lg font-medium mt-20">Your favourite Cast</p>
      <div className="overflow-x-auto no-scrollbar mt-8 pb-4">
        <div className="flex items-center gap-4 w-max px-4">
          {show.movie.casts.slice(0, 12).map((cast, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="relative rounded-full h-20 md:h-20 aspect-square overflow-hidden">
                {!castImagesLoaded[index] && (
                  <div className="absolute inset-0 bg-gray-700 animate-pulse" />
                )}
                <img
                  src={
                    image_base_url.replace("/w500", "/w185") + cast.profile_path
                  }
                  alt={cast.name}
                  loading="lazy"
                  onLoad={() =>
                    setCastImagesLoaded((prev) => ({ ...prev, [index]: true }))
                  }
                  className={`rounded-full h-20 md:h-20 aspect-square object-cover transition-opacity duration-300 ${
                    castImagesLoaded[index] ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
              <p className="font-medium text-xs mt-3">{cast.name}</p>
            </div>
          ))}
        </div>
      </div>

      <Dateselect dateTime={show.dateTime} id={id} />

      <p className="text-lg font-medium mt-20 mb-8">You may also like</p>
      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {shows.slice(0, 4).map((movie, index) => (
          <MovieCard key={index} movie={movie} />
        ))}
      </div>
      <div className="flex justify-center mt-20">
        <button
          onClick={() => {
            navigate("/movies");
            scrollTo(0, 0);
          }}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer"
        >
          Show more
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default MovieDetails;
