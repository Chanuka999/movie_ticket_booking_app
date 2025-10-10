import { StarIcon } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import timeFormat from "../lib/timeFormat";

const MovieCard = ({ movie = {} }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col justify-between p-3 bg-gray-800 rounded-2xl hover:-translate-y-1 transition duration-300 w-66">
      <img
        onClick={() => {
          navigate(`/movies/${movie?._id}`);
          scrollTo(0, 0);
        }}
        src={movie?.backdrop_path}
        alt=""
        className="rounded-lg h-52 w-full object-cover object-right-bottom cursor-pointer"
      />

      <p className="font-semibold mt-2 truncate">
        {movie?.title ?? "Untitled"}
      </p>

      <p className="text-sm text-gray-400 mt-2">
        {movie?.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A"}{" "}
        .{" "}
        {Array.isArray(movie?.genres) && movie.genres.length > 0
          ? movie.genres
              .slice(0, 2)
              .map((genre) => genre.name)
              .join("|")
          : "N/A"}{" "}
        . {timeFormat(movie.runtime)}
      </p>

      <div>
        <button className="px-4 py-2 text-xs bg-primary-dull transition rounded-full font-medium cursor-pointer">
          Buy Tickets
          <p className="flex flex-center gap-1 text-sm text-gray-400 mt-1 pr-1">
            <StarIcon className="w-4 h-4 text-primary full-primary" />
            {typeof movie?.vote_average === "number"
              ? movie.vote_average.toFixed(1)
              : "0.0"}
          </p>
        </button>
      </div>
    </div>
  );
};

export default MovieCard;
