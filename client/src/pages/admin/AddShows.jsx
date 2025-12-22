import React, { useEffect, useState } from "react";
import { dummyShowsData } from "../../assets/assets";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import { CheckIcon, DeleteIcon, StarIcon } from "lucide-react";
import { kConverter } from "../../lib/kConverter";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const AddShows = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();

  const _currency = import.meta.env.VITE_CURRENCY;
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [_selectedMovie, _setSelectedMovie] = useState(null);
  // store selection as an object: { '2025-07-24': ['01:00','03:00'] }
  const [_dateTimeSelection, _setDateTimeSelection] = useState({});
  const [_dateTimeInput, _setDateTimeInput] = useState("");
  const [_showPrice, _setShoprice] = useState("");
  const [addingShow, setAddingShow] = useState(false);

  const fetchNowPlayingMovies = async () => {
    try {
      const { data } = await axios.get("/api/show/now-playing", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setNowPlayingMovies(data.movies);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
    }
  };

  const handleDateTimeAdd = () => {
    if (!_dateTimeInput) return;
    // expected format from datetime-local: YYYY-MM-DDTHH:MM
    const [date, time] = _dateTimeInput.split("T");
    if (!date || !time) return;

    _setDateTimeSelection((prev = {}) => {
      const times = Array.isArray(prev[date]) ? prev[date] : [];
      if (!times.includes(time)) {
        return { ...prev, [date]: [...times, time] };
      }
      return prev;
    });

    _setDateTimeInput("");
  };

  const handleRemoveTime = (date, time) => {
    // remove a specific time for a given date; if no times left, remove the date key
    _setDateTimeSelection((prev = {}) => {
      const times = Array.isArray(prev[date]) ? prev[date] : [];
      const newTimes = times.filter((t) => t !== time);
      if (newTimes.length === 0) {
        // remove the date key
        const { [date]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [date]: newTimes };
    });
  };

  const handleSubmit = async () => {
    try {
      setAddingShow(true);
      if (
        !_selectedMovie ||
        Object.keys(_dateTimeSelection).length === 0 ||
        !_showPrice
      ) {
        return toast("Missing required fields");
      }
      const showsInput = Object.entries(_dateTimeSelection).map(
        ([date, time]) => ({ date, time })
      );

      const payload = {
        movieId: _selectedMovie,
        showsInput,
        showPrice: Number(_showPrice),
      };

      const { data } = await axios.post("/api/show/add", payload, {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      if (data.success) {
        toast.success(data.message);
        _setSelectedMovie(null);
        _setDateTimeSelection({});
        _setShoprice("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("submission error:", error);
      toast.error("An error occured.please try again.");
    }
    setAddingShow(false);
  };

  useEffect(() => {
    if (user) {
      fetchNowPlayingMovies();
    }
  }, [user]);
  return nowPlayingMovies.length > 0 ? (
    <>
      <Title text1="Add" text2="Shows" />
      <p className="mt-10 text-lg font-medium">Now Playing Movies</p>
      <div className="overflow-x-auto pb-4">
        <div className="group flex flex-wrap gap-4 mt-4 w-max">
          {nowPlayingMovies.map((movie) => {
            const movieId = movie._id || movie.id;
            return (
              <div
                key={movieId}
                className={`relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300`}
                onClick={() => _setSelectedMovie(movieId)}
              >
                <div>
                  <img
                    src={image_base_url + movie.poster_path}
                    alt=""
                    className="w-full object-cover brightness-90"
                  />
                  <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
                    <p className="flex items-center gap-1 text-gray-400">
                      <StarIcon className="w-4 h-4 text-primary" />
                      {typeof movie.vote_average === "number"
                        ? movie.vote_average.toFixed(1)
                        : "-"}
                    </p>
                    <p className="text-gray-300">
                      {kConverter(movie.vote_count)}Votes
                    </p>
                  </div>
                </div>
                {_selectedMovie === movieId && (
                  <div className="absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded">
                    <CheckIcon
                      className="w-4 h-4 text-white"
                      strokeWidth={2.5}
                    />
                  </div>
                )}
                <p className="font-medium truncate">{movie.title}</p>
                <p className="text-gray-400 text-sm">{movie.release_date}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <label className="block text-sm font-medium mb-2">Show Price</label>
        <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md">
          <p className="text-gray-400 text-sm ">{_currency || "$"}</p>
          <input
            min={0}
            type="number"
            value={_showPrice}
            onChange={(e) => _setShoprice(e.target.value)}
            placeholder="Enter show price"
            className="outline-none"
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">
          Show Date and Time
        </label>
        <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-lg">
          <input
            min={0}
            type="datetime-local"
            value={_dateTimeInput}
            onChange={(e) => _setDateTimeInput(e.target.value)}
            className="outline-none rounded-md"
          />
          <button
            onClick={handleDateTimeAdd}
            className="bg-primary/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer"
          >
            Add Time
          </button>
        </div>
      </div>

      {Object.keys(_dateTimeSelection).length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2">Selected Date-Time</h2>
          <ul className="space-y-3">
            {Object.entries(_dateTimeSelection).map(([date, times]) => (
              <li key={date}>
                <div className="font-medium">{date}</div>
                <div className="flex flex-wrap gap-2 mt-1 text-sm">
                  {times.map((time) => (
                    <div
                      key={time}
                      className="border border-primary px-2 py-1 flex items-center rounded"
                    >
                      <span>{time}</span>
                      <DeleteIcon
                        onClick={() => handleRemoveTime(date, time)}
                        width={15}
                        className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={handleSubmit}
        disabled={addingShow}
        className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer"
      >
        Add Show
      </button>
    </>
  ) : (
    <Loading />
  );
};

export default AddShows;
