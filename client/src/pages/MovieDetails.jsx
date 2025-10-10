import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { dummyShowsData } from "../assets/assets";

const MovieDetails = () => {
  const { id } = useParams();
  const [show, setShow] = useState(null);

  const getShow = async () => {
    const show = dummyShowsData.find((show) => show._id === id);
  };
  return <div></div>;
};

export default MovieDetails;
