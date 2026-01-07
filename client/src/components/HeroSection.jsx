import React, { useState, useEffect } from "react";
import { assets } from "../assets/assets";
import backgroundImage from "../assets/backgroundImage.png";
import backgroundImage1 from "../assets/backgroundImage1.jpg";
import backgroundImage2 from "../assets/backgroundImage2.jpg";
import backgroundImage3 from "../assets/backgroundImage3.jpg";
import { ArrowRight, CalendarIcon, ClockIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState({});

  const backgrounds = [
    backgroundImage,
    backgroundImage1,
    backgroundImage2,
    backgroundImage3,
  ];

  // Preload images
  useEffect(() => {
    backgrounds.forEach((src, index) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImagesLoaded((prev) => ({ ...prev, [index]: true }));
      };
    });
  }, []);

  const moviesData = [
    {
      title: "Game Of Thrones",
      genre: "Action | Adventure | Sci-Fi",
      year: "2018",
      duration: "2h 8m",
      description:
        "Discover and book your favorite movies in just a few clicks! Explore the latest releases, watch trailers, check showtimes, and reserve your seats instantly.",
    },
    {
      title: "Stranger Things",
      genre: "Action | Adventure | Fantasy",
      year: "2025",
      duration: "tv series",
      description:
        "Stranger Things is a nostalgic sci-fi horror series set in the 1980s, centered on the fictional town of Hawkins, Indiana, where a young boy's disappearance uncovers a mystery involving secret government experiments, supernatural forces, a parallel dimension called the Upside Down, and a powerful girl with psychokinetic abilities named Eleven,",
    },
    {
      title: "Predator: Badlands ",
      genre: "Sci-Fi | Thriller | Mystery",
      year: "2025",
      duration: "2h 28m",
      description:
        "Predator: Badlands follows Dek, a young, outcast Predator, who crash-lands on the deadly planet Genna for his first hunt, seeking to prove himself, but forms an unexpected alliance with Thia, a Weyland-Yutani synthetic, to survive and find the ultimate prey, blurring the lines between hunter and hunted in a story about trust and honor",
    },
    {
      title: " Avatar: Frontiers of Pandora",
      genre: "Action | Crime | Drama",
      year: "2025",
      duration: "2h 32m",
      description:
        "Avatar: Fire and Ash, continues the story of Jake Sully and Neytiri's family as they encounter a new, aggressive Na'vi tribe, the Ash People, while the conflict with humanity escalates. ",
    },
  ];

  const currentMovie = moviesData[currentBgIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % backgrounds.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 bg-cover bg-center h-screen w-full transition-all duration-1000"
      style={{
        backgroundImage: `url(${backgrounds[currentBgIndex]})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: imagesLoaded[currentBgIndex] ? 1 : 0.7,
        transition: "opacity 0.5s ease-in-out",
      }}
    >
      <h1 className="text-5xl md:text-[70px] md:leading-18 font-bold max-w-110 text-green-700 transition-all duration-1000">
        {currentMovie.title.split(" ").map((word, idx) => (
          <span key={idx}>
            {word}
            {idx < currentMovie.title.split(" ").length - 1 && <br />}
          </span>
        ))}
      </h1>

      <div className="flex items-center gap-4 text-gray-300 transition-all duration-1000">
        <span>{currentMovie.genre}</span>
        <div className="flex items-center gap-1 text-red-600">
          <CalendarIcon className="w-4.5 h-4.5" />
          {currentMovie.year}
        </div>
        <div className="flex items-center gap-1">
          <ClockIcon className="w-4.5 h-4.5" />
          {currentMovie.duration}
        </div>
      </div>
      <p className="max-w-md text-yellow-600 transition-all duration-1000">
        {currentMovie.description}
      </p>
      <button
        onClick={() => navigate("/movies")}
        className="flex items-center gap-1 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
      >
        Explore Movies
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default HeroSection;
