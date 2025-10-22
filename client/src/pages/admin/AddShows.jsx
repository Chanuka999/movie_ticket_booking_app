import React, { useState } from "react";
import { dummyBookingData } from "../../assets/assets";

const AddShows = () => {
  const currency = import.meta.env.VITE_CURRENCY;
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [dateTimeSelection, setDateTimeSelection] = useState("");
  const [dateTimeInput, setDateTimeInput] = useState("");
  const [showPrice, setShoprice] = useState("");

  const fetchNowPlayingMovies = async () => {
    setNowPlayingMovies(dummyBookingData);
  };
  return <div></div>;
};

export default AddShows;
