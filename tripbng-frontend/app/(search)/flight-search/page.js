"use client";

import Simmer from "@/components/layout/simmer";
import Button from "@/components/ui/button";
import { Checkbox, Slider, Typography } from "@mui/material";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronRight,
  CircleChevronLeftIcon,
  CircleX,
  Filter,
  MapPin,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { format, parse, isValid } from "date-fns";
import { apiService } from "@/lib/api";
import toast from "react-hot-toast";
import { DatePicker, Modal } from "antd";
import { Time } from "@/constants/data/time";
import FAREDETAILS from "@/components/flight/fare-details";
import { motion } from "framer-motion";
import LocationSelector, {
  DropdownProvider,
} from "@/components/flight/LocationSelector";
import dayjs from "dayjs";
import FlightTraveller from "@/components/flight/FlightTraveller";

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const itinerary = searchParams.get("itinerary");
  const tripType = searchParams.get("tripType");
  const paxType = searchParams.get("paxType");
  const intl = searchParams.get("intl");
  const cabinClass = searchParams.get("cabinClass");
  const fareTypeParam = searchParams.get("fareType");

  const [selectedDate, setSelectedDate] = useState(null);
  const [origin, setOrigin] = useState({
    code: "DEL",
    name: "Indira Gandhi International Airport",
    municipality: "Delhi",
    country: "IN",
  });
  const [destination, setDestination] = useState({
    code: "DEL",
    name: "Indira Gandhi International Airport",
    municipality: "Delhi",
    country: "IN",
  });
  const [originDropdown, setOriginDropdown] = useState({});
  const [destinationDropdown, setDestinationDropdown] = useState({});
  const [originName, setOriginName] = useState("");
  const [destinationName, setDestinationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [adultCount, setAdultCount] = useState("1");
  const [childCount, setChildCount] = useState("");
  const [infantCount, setInfantCount] = useState("");
  const [returnDate, setReturnDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState({
    onward: null,
    return: null,
  });
  const [selectedOnward, setSelectedOnward] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [selectedPrice, setSelectedPrice] = useState(maxPrice);
  const [airlineDetails, setAirlineDetails] = useState([]);
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [selectedOnwardStops, setSelectedOnwardStops] = useState([]);
  const [selectedReturnStops, setSelectedReturnStops] = useState([]);
  const [departureDate, setDepartureDate] = useState(null);
  const [returnDates, setReturnDates] = useState([]);
  const [activePicker, setActivePicker] = useState(null);
  const [isDateChange, setIsDateChange] = useState(false);
  const [travelerCounts, setTravelerCounts] = useState({
    a: 1,
    c: 0,
    i: 0,
    tp: 0,
  });
  const [fareType, setFareType] = useState("");
  const [selectedFareType, setSelectedFareType] = useState("");
  const [selectedTripType, setSelectedTripType] = useState("One Way");
  const handleOpenPicker = (picker) => {
    setActivePicker(picker);
  };
  const handleSelectDepartureDate = (date) => {
    const dayjsDate = dayjs(date); // Convert to dayjs object
    if (dayjs.isDayjs(dayjsDate)) {
      setSelectedDate(dayjsDate);
      setIsDateChange(true);
    } else {
      console.log("Invalid date selected");
    }
    setTimeout(() => setActivePicker(null), 100); // Close picker
  };

  const handleSelectReturnDates = (dates) => {
    const dayjsDate = dayjs(dates);
    if (dayjs.isDayjs(dayjsDate) && dates.length === 2) {
      setSelectedDate(dates[0]);
      setReturnDate(dates[1]);
      setIsDateChange(true);
      setSelectedTripType("Rounded");
    }
    setTimeout(() => {
      setActivePicker(null);
    }, 100);
  };

  const disabledDate = (current) => {
    // Can not select days before today and today
    return current && current < dayjs().startOf("day");
  };
  const [
    selectedDepartureTimeRangesCity1,
    setSelectedDepartureTimeRangesCity1,
  ] = useState([]);
  const [selectedArrivalTimeRangesCity2, setSelectedArrivalTimeRangesCity2] =
    useState([]);
  const [
    selectedDepartureTimeRangesCity2,
    setSelectedDepartureTimeRangesCity2,
  ] = useState([]);
  const [selectedArrivalTimeRangesCity1, setSelectedArrivalTimeRangesCity1] =
    useState([]);

  const getMinFareFromAmount = (amountArray) => {
    if (!Array.isArray(amountArray)) return Infinity;

    return Math.min(
      ...amountArray.map((a) => {
        if (Array.isArray(a.FareDetails)) {
          return Math.min(...a.FareDetails.map((f) => f.Total_Amount));
        } else if (a.fd?.ADULT?.fC?.TF !== undefined) {
          return a.fd.ADULT.fC.TF;
        }
        return Infinity;
      })
    );
  };

  useEffect(() => {
    const calculateMinMaxPrices = () => {
      let allPrices = [];

      if (flights?.OneWay) {
        allPrices = allPrices.concat(extractPrices(flights.OneWay));
      }

      if (flights?.data?.FlightOnward) {
        allPrices = allPrices.concat(extractPrices(flights.data.FlightOnward));
      }

      if (flights?.data?.FlightReturn) {
        allPrices = allPrices.concat(extractPrices(flights.data.FlightReturn));
      }

      if (allPrices.length > 0) {
        const min = Math.min(...allPrices);
        const max = Math.max(...allPrices);
        setMinPrice(min);
        setMaxPrice(max);
        setSelectedPrice(max);
      } else {
        setMinPrice(0);
        setMaxPrice(100000);
        setSelectedPrice(100000);
      }
    };

    calculateMinMaxPrices();
  }, [flights]);

  const extractPrices = (flightList) => {
    if (!flightList) return [];
  
    return flightList.flatMap(flight =>
      flight?.Amount?.flatMap(amount => {
        // API 1 format: amount?.FareDetails?.map(fare => fare.Total_Amount)
        const api1Prices = amount?.FareDetails?.map(fare => fare.Total_Amount) || [];
  
        // API 2 format: amount?.fd?.ADULT?.fC?.TF
        const api2Price = amount?.fd?.ADULT?.fC?.TF;
  
        return [...api1Prices, ...(typeof api2Price === 'number' ? [api2Price] : [])];
      }) || []
    );
  };

  const handlePriceChange = (event, newValue) => {
    setSelectedPrice(newValue);
  };

  const isTimeWithinRanges = (flight, timeRanges, isArrival = false) => {
    if (!timeRanges || timeRanges.length === 0) return true;

    let flightTime;
    if (flight.ApiNo === 1) {
      flightTime = isArrival
        ? flight.Destination?.ArrivalTime?.split(" ")[1]
        : flight.Origin?.DepartTime?.split(" ")[1];
    } else {
      const segments = flight.Additional1?.sagment || [];
      if (segments.length === 0) return false;

      const segment = isArrival ? segments[segments.length - 1] : segments[0];

      flightTime = isArrival
        ? segment?.at?.split("T")[1]
        : segment?.dt?.split("T")[1];
    }

    if (!flightTime) return false;

    const [hours, minutes] = flightTime.split(":").map(Number);
    const flightTimeInMinutes = hours * 60 + minutes;

    return timeRanges.some((timeRange) => {
      const [start, end] = timeRange.split("-");
      const [startHours, startMins] = start.split(":").map(Number);
      const [endHours, endMins] = end.split(":").map(Number);

      const startInMinutes = startHours * 60 + startMins;
      const endInMinutes = endHours * 60 + endMins;

      return (
        flightTimeInMinutes >= startInMinutes &&
        flightTimeInMinutes <= endInMinutes
      );
    });
  };

  const isDirectFlight = (flight) => {
    const segments = flight?.Additional1?.sagment;

    // Check if segments exist and their count is 1
    if (Array.isArray(segments) && segments.length === 1) {
      return true; // Direct flight
    }

    return false; // Non-direct flight
  };

  useEffect(() => {
    if (flights?.data) {
      console.log("Flights Data:", flights.data);

      let selectedOnwardFlight = null;
      let selectedReturnFlight = null;
      let minOnwardDuration = Infinity;
      let minReturnDuration = Infinity;

      if (flights.data.FlightOnward?.length > 0) {
        const filteredOnward = flights.data.FlightOnward.filter((flight) => {
          const minPrice = Math.min(
            ...flight.Amount.map((a) =>
              Math.min(
                ...(Array.isArray(a.FareDetails)
                  ? a.FareDetails.map((f) => f.Total_Amount)
                  : [Infinity])
              )
            )
          );
          const isDirect = isDirectFlight(flight);
          const isTimeValid =
            isTimeWithinRanges(flight, selectedDepartureTimeRangesCity1) &&
            isTimeWithinRanges(flight, selectedArrivalTimeRangesCity2, true);

          console.log(
            "Filtering Onward Flight:",
            flight.ApiId,
            "Price:",
            minPrice,
            "Direct:",
            isDirect,
            "Time Valid:",
            isTimeValid
          );

          return (
            minPrice <= selectedPrice &&
            isTimeValid &&
            (selectedAirlines.length === 0 ||
              selectedAirlines.includes(flight.AirlineCode)) &&
            (selectedOnwardStops.length === 0 ||
              (isDirect && selectedOnwardStops.includes("Non-Stop")) ||
              (!isDirect && selectedOnwardStops.includes("1-Stop")))
          );
        });

        console.log("Filtered Onward Flights:", filteredOnward);

        if (filteredOnward.length > 0) {
          filteredOnward.forEach((flight) => {
            const totalDuration = calculateTotalDuration(flight);
            console.log(`Flight ${flight.ApiId} Duration:`, totalDuration);
            if (totalDuration < minOnwardDuration) {
              minOnwardDuration = totalDuration;
              selectedOnwardFlight = flight;
            }
          });

          console.log("Selected Onward Flight:", selectedOnwardFlight);
        } else {
          // If no flights match the criteria, select the first flight
          selectedOnwardFlight = flights.data.FlightOnward[0];
        }
      }

      if (flights.data.FlightReturn?.length > 0) {
        const filteredReturn = flights.data.FlightReturn.filter((flight) => {
          const minPrice = Math.min(
            ...flight.Amount.map((a) =>
              Math.min(
                ...(Array.isArray(a.FareDetails)
                  ? a.FareDetails.map((f) => f.Total_Amount)
                  : [Infinity])
              )
            )
          );
          const isDirect = isDirectFlight(flight);
          const isTimeValid =
            isTimeWithinRanges(flight, selectedDepartureTimeRangesCity2) &&
            isTimeWithinRanges(flight, selectedArrivalTimeRangesCity1, true);

          console.log(
            "Filtering Return Flight:",
            flight.ApiId,
            "Price:",
            minPrice,
            "Direct:",
            isDirect,
            "Time Valid:",
            isTimeValid
          );

          return (
            minPrice <= selectedPrice &&
            isTimeValid &&
            (selectedAirlines.length === 0 ||
              selectedAirlines.includes(flight.AirlineCode)) &&
            (selectedReturnStops.length === 0 ||
              (isDirect && selectedReturnStops.includes("Non-Stop")) ||
              (!isDirect && selectedReturnStops.includes("1-Stop")))
          );
        });

        console.log("Filtered Return Flights:", filteredReturn);

        if (filteredReturn.length > 0) {
          filteredReturn.forEach((flight) => {
            const totalDuration = calculateTotalDuration(flight);
            console.log(`Flight ${flight.ApiId} Duration:`, totalDuration);
            if (totalDuration < minReturnDuration) {
              minReturnDuration = totalDuration;
              selectedReturnFlight = flight;
            }
          });

          console.log("Selected Return Flight:", selectedReturnFlight);
        } else {
          // If no flights match the criteria, select the first flight
          selectedReturnFlight = flights.data.FlightReturn[0];
        }
      }

      if (selectedOnwardFlight) {
        setSelectedOnward(selectedOnwardFlight);
      }
      if (selectedReturnFlight) {
        setSelectedReturn(selectedReturnFlight);
      }
    }
  }, [
    flights?.data,
    selectedPrice,
    selectedDepartureTimeRangesCity1,
    selectedArrivalTimeRangesCity2,
    selectedDepartureTimeRangesCity2,
    selectedArrivalTimeRangesCity1,
    selectedAirlines,
    selectedOnwardStops,
    selectedReturnStops,
  ]);

  const calculateTotalDuration = (flight) => {
    let totalMinutes = 0;

    if (flight.ApiNo === 1) {
      // For ApiNo === 1: Sum durations from segments using the "Duration" field
      if (flight.Additional1 && flight.Additional1.sagment) {
        flight.Additional1.sagment.forEach((segment) => {
          const [hours, minutes] = segment.Duration.split(":");
          totalMinutes += parseInt(hours) * 60 + parseInt(minutes);
        });
      }
    } else if (flight.ApiNo === 2) {
      // For ApiNo === 2: Sum durations from segments using the "duration" field
      if (flight.Additional1 && flight.Additional1.sagment) {
        flight.Additional1.sagment.forEach((segment) => {
          totalMinutes += segment.duration;
        });
      }
    } else {
      return Infinity; // Handle cases where duration data is missing
    }

    return totalMinutes;
  };

  const handleOnwardStopChange = (event, stopType) => {
    if (event.target.checked) {
      setSelectedOnwardStops((prev) => [...prev, stopType]);
    } else {
      setSelectedOnwardStops((prev) =>
        prev.filter((stop) => stop !== stopType)
      );
    }
  };

  const handleReturnStopChange = (event, stopType) => {
    if (event.target.checked) {
      setSelectedReturnStops((prev) => [...prev, stopType]);
    } else {
      setSelectedReturnStops((prev) =>
        prev.filter((stop) => stop !== stopType)
      );
    }
  };

  const handleOpenModal = (onward, returnFlight = null) => {
    const searchKey = flights?.searchkey;
    if (typeof window !== "undefined" && searchKey) {
      localStorage.setItem("searchKey", searchKey);
    }

    setSelectedFlight({
      onward,
      return: returnFlight,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFlight(null);
  };

  const paxTotal =
    Number(adultCount) + Number(childCount) + Number(infantCount);

  const fareTypes = [
    { value: "STUDENT", type: "Student", description: "Student fares" },
    {
      value: "SENIORCITIZEN",
      type: "Senior Citizen",
      description: "Senior Citizen fares",
    },
  ];
  const toggleFareType = (value) => {
    setSelectedFareType((prevFareType) => {
      return prevFareType === value ? "" : value;
    });
  };
  console.log(fareType);

  useEffect(() => {
    const storedTrip = localStorage.getItem("selectedTrip");
    if (storedTrip) {
      const parsedTrip = JSON.parse(storedTrip);
      console.log("sd", parsedTrip);

      setOrigin(parsedTrip.origin);
      setOriginName(parsedTrip.origin.municipality);
      setDestination(parsedTrip.destination);
      setDestinationName(parsedTrip.destination.municipality);
      setOriginDropdown(parsedTrip.origin);
      setDestinationDropdown(parsedTrip.destination);
    }
  }, []);

  const generateDatePrices = () => {
    const today = new Date();
    let dates = [];
    for (let i = 0; i < 15; i++) {
      const newDate = new Date(today);
      newDate.setDate(today.getDate() + i);
      dates.push({
        id: format(newDate, "EEE, dd MMM"),
        price: (10000 + i * 5000).toString(),
      });
    }
    return dates;
  };

  const datePrice = generateDatePrices();

  const handleSelectDate = (date, price) => {
    const currentYear = new Date().getFullYear();
    let fullDateString = date;

    if (date && !date.includes(currentYear)) {
      fullDateString = `${date} ${currentYear}`;
    }

    const selectedDateObj = new Date(fullDateString);

    if (isNaN(selectedDateObj.getTime())) {
      console.error("Invalid date detected:", fullDateString);
      return;
    }

    if (isValid(selectedDateObj)) {
      setSelectedDate(selectedDateObj);
      setSelectedPrice(price);
    } else {
      console.error("Parsed date is invalid:", selectedDateObj);
    }
  };

  const handleCheckboxChange = (event, airlineCode) => {
    if (event.target.checked) {
      setSelectedAirlines((prev) => [...prev, airlineCode]);
    } else {
      setSelectedAirlines((prev) =>
        prev.filter((code) => code !== airlineCode)
      );
    }
  };

  useEffect(() => {
    if (itinerary) {
      const parts = itinerary.split("-");
      if (parts.length >= 3) {
        const dateParts = parts[2].split("_");
        if (dateParts.length > 0) {
          const depDate = parse(dateParts[0], "dd/MM/yyyy", new Date());
          if (isValid(depDate)) setSelectedDate(dayjs(depDate));
        }
        if (dateParts.length > 1 && tripType === "R") {
          const retDate = parse(dateParts[1], "dd/MM/yyyy", new Date());
          if (isValid(retDate)) setReturnDate(dayjs(retDate));
        }
      }
    }

    if (paxType) {
      const paxParts = paxType.split("_");
      let tempAdult = "1",
        tempChild = "0",
        tempInfant = "0";

      paxParts.forEach((pax) => {
        const [type, count] = pax.split("-");
        const parsedCount = count ? count.toString() : "0";

        if (type === "A") tempAdult = parsedCount;
        if (type === "C") tempChild = parsedCount;
        if (type === "I") tempInfant = parsedCount;
      });

      setAdultCount(tempAdult);
      setChildCount(tempChild);
      setInfantCount(tempInfant);
    }
    setFareType(fareTypeParam || null);
  }, [itinerary, paxType, tripType, fareType]);

  const formattedTravelDateFull =
    selectedDate && dayjs.isDayjs(selectedDate)
      ? selectedDate.format("ddd, MMM D") // Short weekday, month name, day
      : "N/A";

  const formattedTravelDateShort =
    selectedDate && dayjs.isDayjs(selectedDate)
      ? selectedDate.format("ddd, D MMM")
      : "N/A";

  const apiTravelDate =
    selectedDate && dayjs.isDayjs(selectedDate)
      ? selectedDate.format("DD-MM-YYYY")
      : "";

  const formattedReturnDateFull =
    returnDate && dayjs.isDayjs(returnDate)
      ? returnDate.format("ddd, MMM D")
      : "";

  const formattedReturnDateShort =
    returnDate && dayjs.isDayjs(returnDate)
      ? returnDate.format("ddd, D MMM")
      : "N/A";

  const apiReturnDate =
    returnDate && dayjs.isDayjs(returnDate)
      ? returnDate.format("DD-MM-YYYY")
      : "";

  useEffect(() => {
    if (isDateChange) {
      setIsDateChange(false);
      return;
    }
    if (origin && destination && apiTravelDate && adultCount) {
      fetchFlights();
    }
  }, [origin, destination, apiTravelDate, adultCount, childCount, infantCount]);

  const extractAirlineDetails = (flightsData) => {
    const airlineDetails = new Map();

    const addAirlineDetail = (airlineCode, airlineName, airlineImage) => {
      if (!airlineDetails.has(airlineCode)) {
        airlineDetails.set(airlineCode, { airlineName, airlineImage });
      }
    };

    if (flightsData.OneWay) {
      flightsData.OneWay.forEach((flight) => {
        addAirlineDetail(
          flight.AirlineCode,
          flight.AirlineName,
          flight.AirlineImage
        );
      });
    }

    if (flightsData.data?.FlightOnward) {
      flightsData.data.FlightOnward.forEach((flight) => {
        addAirlineDetail(
          flight.AirlineCode,
          flight.AirlineName,
          flight.AirlineImage
        );
      });
    }

    if (flightsData.data?.FlightReturn) {
      flightsData.data.FlightReturn.forEach((flight) => {
        addAirlineDetail(
          flight.AirlineCode,
          flight.AirlineName,
          flight.AirlineImage
        );
      });
    }

    return Array.from(airlineDetails.entries()).map(
      ([airlineCode, details]) => ({
        airlineCode,
        ...details,
      })
    );
  };

  const fetchFlights = async () => {
    setLoading(true);
    try {
      const response = await apiService.post("/flight/getFlights", {
        Travel: {
          FromCity: originDropdown.code,
          toCity: destinationDropdown.code,
          Cabine: "0",
          Travel_Date: apiTravelDate,
          Return_Date: apiReturnDate,
          Travel_Type: intl,
        },
        Traveler: {
          Adult_Count: adultCount,
          Child_Count: childCount,
          Infant_Count: infantCount,
        },
        isReturn: apiReturnDate === "" ? false : true,
        SrCitizen: fareType === "SENIORCITIZEN" ? true : false,
        Student: fareType === "STUDENT" ? true : false,
        Direct: [1, 2, 3, 4],
      });
      if (response.status === 200) {
        setFlights(response?.data);

        const airlineDetails = extractAirlineDetails(response?.data);
        setAirlineDetails(airlineDetails);
      }
    } catch (error) {
      toast.error("Failed to fetch flights.");
    } finally {
      setLoading(false);
    }
  };

  // Total oneway and return price
  // const getMinPrice = (flight) => {
  //   if (!flight?.Amount) return 0;
  //   return Math.min(
  //     ...flight.Amount.map((a) =>
  //       Math.min(...a.FareDetails.map((f) => f.Total_Amount))
  //     )
  //   );
  // };

  const getMinPrice = (flight) => {
    if (!flight?.Amount || !Array.isArray(flight.Amount)) return 0;
    const prices = flight.Amount.flatMap((a) =>
      Array.isArray(a?.FareDetails)
        ? a.FareDetails.map((f) => f.Total_Amount)
        : []
    );
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const onwardFare = selectedOnward?.Amount
    ? getMinFareFromAmount(selectedOnward.Amount)
    : 0;

  const returnFare = selectedReturn?.Amount
    ? getMinFareFromAmount(selectedReturn.Amount)
    : 0;

  const totalFare = onwardFare + returnFare;

  const handleSearch = async () => {
    const isInternational =
      originDropdown.country === "IN" && destinationDropdown.country === "IN"
        ? 0
        : 1;

    const itinerary = `${originDropdown.code}-${
      destinationDropdown.code
    }-${selectedDate.format("DD/MM/YYYY")}${
      selectedTripType === "Rounded"
        ? `_${returnDate.format("DD/MM/YYYY")}`
        : ""
    }`;

    const paxType = `A-${travelerCounts.a}_C-${travelerCounts.c}_I-${travelerCounts.i}`;

    const makemytripUrl = `flight-search/?itinerary=${itinerary}&tripType=${
      selectedTripType === "One Way" ? "O" : "R"
    }&paxType=${paxType}&intl=${isInternational}&cabinClass=E${
      selectedFareType ? `&fareType=${selectedFareType}` : ""
    }`;

    localStorage.setItem(
      "selectedTrip",
      JSON.stringify({
        origin: originDropdown,
        destination: destinationDropdown,
        departureDate: selectedDate.format("YYYY-MM-DD"),
        returnDate:
          selectedTripType === "Rounded"
            ? returnDate.format("YYYY-MM-DD")
            : null,
        travelerCounts,
        selectedTripType,
        selectedFareType,
        isInternational,
      })
    );

    // Update URL without reloading the page
    router.push(makemytripUrl, undefined, { shallow: true });

    // Call the API after the URL and localStorage are updated
    await fetchFlights();
  };
  const handleClearFilters = () => {
    setSelectedAirlines([]);
    setSelectedOnwardStops([]);
    setSelectedReturnStops([]);
    setSelectedDepartureTimeRangesCity1([]);
    setSelectedArrivalTimeRangesCity2([]);
    setSelectedDepartureTimeRangesCity2([]);
    setSelectedArrivalTimeRangesCity1([]);
    setSelectedPrice(maxPrice);

    // Add any other filter reset logic as needed
  };
  const AirlineDetails = ({ seatAvailability, AirlineCode, FlightNumber }) => (
    <div className="flex md:flex-col flex-row md:gap-0 gap-2">
      <p className="md:text-sm text-gray-500">
        {AirlineCode} {FlightNumber}
      </p>
      <p
        className="md:text-sm font-medium hidden md:block bg-gradient-to-r from-[#046994] via-[#57c785] to-white bg-clip-text text-transparent"
      >
        Economy
      </p>
      <p className="text-sm hidden md:block">
        {seatAvailability || 0} seat(s) available
      </p>
    </div>
  );
  

  return (
    <DropdownProvider>
      <div className="flex flex-col gap-4">
        <div className="bg-white shadow-sm py-6  hidden md:block  fixed top-16 left-0 right-0 z-40">
          <div className="container flex flex-wrap items-center gap-4">
            <p className="font-semibold">
              Special Fares <span className="text-gray">(Optional)</span>:
            </p>
            {fareTypes.map(({ value, type, description }) => (
              <button
                key={value}
                className={`p-2 rounded-lg flex items-center gap-2 cursor-pointer border ${
                  selectedFareType === value
                    ? "border-2 bg-blue text-white border-white"
                    : "border-neutral-300"
                }`}
                onClick={() => toggleFareType(value)}
              >
                <div className="flex flex-col items-start">
                  <p className="text-sm font-semibold">{type}</p>
                </div>
                {selectedFareType === value && <CircleX size={15} />}
              </button>
            ))}
          </div>

          <div className="container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mt-3 p-2 bg-white rounded-xl">
            <div className="border py-2 px-4 rounded-tl-xl sm:rounded-l-xl flex flex-col gap-0.5 bg-gray/10">
              <LocationSelector
                label="From"
                placeholder="Select origin"
                value={originDropdown}
                onChange={setOriginDropdown}
                module="FlightList"
              />
            </div>

            <div className="border py-2 px-4 flex flex-col gap-0.5 bg-gray/10">
              <LocationSelector
                label="To"
                placeholder="Select origin"
                value={destinationDropdown}
                onChange={setDestinationDropdown}
                module="FlightList"
              />
            </div>

            <div
              className="border py-2 px-4 flex flex-col gap-0.5 bg-gray/10"
              onClick={() => setActivePicker("departure")}
            >
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={12} /> Departure
              </p>
              {selectedDate ? (
                <p className="text-base font-semibold text-gray-900">
                  {formattedTravelDateFull}
                </p>
              ) : (
                <p className="text-base font-semibold text-gray-900">
                  Select Departure Date
                </p>
              )}
              {activePicker === "departure" && (
                <DatePicker
                  open={true}
                  selected={selectedDate}
                  onChange={handleSelectDepartureDate}
                  onBlur={() => setActivePicker(null)}
                  placeholder=""
                  style={{
                    position: "absolute",
                    zIndex: 9999,
                    width: "auto",
                    opacity: 0,
                    pointerEvents: "none",
                  }}
                  onSelect={(date) => {
                    handleSelectDepartureDate(date);
                    setActivePicker(null);
                  }}
                />
              )}
            </div>

            {/* Return Picker */}
            <div
              className="border py-2 px-4 flex flex-col gap-0.5 bg-gray/10"
              onClick={() => handleOpenPicker("return")}
            >
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={12} /> Return
              </p>
              <p className="text-base font-semibold text-gray-900">
                {formattedReturnDateFull}
              </p>
              {activePicker === "return" && (
                <DatePicker.RangePicker
                  selected={returnDate}
                  onChange={handleSelectReturnDates}
                  dateFormat="dd/MM/yyyy"
                  placeholderText={[
                    "Select Return Start Date",
                    "Select Return End Date",
                  ]}
                  className="w-full p-2 border rounded"
                  disabledDate={disabledDate}
                  open
                  style={{
                    position: "absolute",
                    zIndex: 9999,
                    width: "auto",
                    opacity: 0,
                    pointerEvents: "none",
                  }}
                  value={
                    returnDates.length > 0
                      ? [dayjs(returnDates[0]), dayjs(returnDates[1])]
                      : null
                  }
                />
              )}
            </div>

            <div className="border flex flex-col gap-0.5 bg-gray/10">
              <FlightTraveller
                travelerCounts={travelerCounts}
                setTravelerCounts={setTravelerCounts}
                module="FlightList"
              />
            </div>

            <Button
              className="border py-2 px-4 rounded-r-xl rounded-l-none flex items-center justify-center gap-2 bg-yellow text-white text-2xl font-semibold hover:bg-gray-200"
              onClick={handleSearch}
            >
              <p>Search</p>
              <ChevronRight size={40} />
            </Button>
          </div>
        </div>
        <div className="md:container md:px-4  md:pt-64 pb-12 ">
          <div className="flex flex-col md:flex-row w-full gap-2">
          <aside
  className={`md:w-1/4 lg:w-1/4 mobile-filters ${isFilterOpen ? "open" : ""}`}
>
  <div className="fixed w-[23%] max-w-[350px] h-[calc(100vh-6rem)] overflow-y-auto">
    <div className="bg-white rounded-md p-4 shadow-lg pb-52">
      <div className="flex justify-between items-center gap-2 mb-4">
        <h2 className="text-lg font-bold">Filters</h2>
        <div className="flex gap-2">
          {isFilterOpen && (
            <button
              onClick={() => setIsFilterOpen(false)}
              className="bg-orange-500 hover:bg-orange-600 rounded-lg py-2 px-4 transition-colors"
            >
              <p className="text-sm text-white">Apply</p>
            </button>
          )}
          <button
            onClick={handleClearFilters}
            className="bg-gray-200 hover:bg-gray-300 rounded-lg py-2 px-4 transition-colors"
          >
            <p className="text-sm text-gray-800">Clear All</p>
          </button>
        </div>
      </div>

      {/* Price Filter */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">Flight Price</h3>
        <Slider
          aria-label="Flight Price"
          step={1000}
          min={minPrice}
          max={maxPrice}
          valueLabelDisplay="auto"
          value={selectedPrice}
          onChange={handlePriceChange}
          sx={{
            color: "#FF8E00",
            height: 8,
            "& .MuiSlider-thumb": {
              backgroundColor: "#ffffff",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.3)",
              width: 20,
              height: 20,
              "&:hover": { backgroundColor: "#ffffff" },
            },
            "& .MuiSlider-track": {
              backgroundColor: "#FF8E00",
              height: 8,
            },
            "& .MuiSlider-rail": {
              backgroundColor: "#DCDCDC",
              height: 8,
            },
            "& .MuiSlider-valueLabel": {
              backgroundColor: "#1a68ab",
              color: "white",
            },
          }}
        />
        <div className="flex justify-between items-center mt-1 text-sm text-gray-600">
          <span>₹{minPrice}</span>
          <span>₹{selectedPrice}</span>
        </div>
      </div>

      {/* Onward Journey */}
      <div className="mb-6">
        <h2 className="mb-3 font-bold inline-block border-b-4 border-yellow-500 w-fit">
          Onward Journey
        </h2>
        
        {/* Stops */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2">
            Stops From {originName}
          </h3>
          <div className="space-y-2">
            {["Non-Stop", "1-Stop"].map((stopType) => (
              <div key={stopType} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`onward-${stopType.toLowerCase().replace(' ', '-')}`}
                  className="h-4 w-4 text-orange-500 rounded focus:ring-orange-500 border-gray-300"
                  onChange={(e) => handleOnwardStopChange(e, stopType)}
                />
                <label 
                  htmlFor={`onward-${stopType.toLowerCase().replace(' ', '-')}`}
                  className="text-gray-600 font-medium"
                >
                  {stopType}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Departure Times */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2">
            Departure From {originName}
          </h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            {Time.map((item, index) => (
              <label
                key={index}
                className={`border-2 rounded-lg p-1 flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                  selectedDepartureTimeRangesCity1.includes(item.value)
                    ? "border-blue bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedDepartureTimeRangesCity1.includes(item.value)}
                  onChange={() => {
                    setSelectedDepartureTimeRangesCity1((prev) =>
                      prev.includes(item.value)
                        ? prev.filter(time => time !== item.value)
                        : [...prev, item.value]
                    );
                  }}
                />
                <img
                  src={item.image}
                  alt="Flight time"
                  className="w-6 h-6 object-contain"
                  width={24}
                  height={24}
                />
                <span className="text-xs font-medium">{item.name}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Arrival Times */}
        <div>
          <h3 className="text-sm font-semibold mb-2">
            Arrival at {destinationName}
          </h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            {Time.map((item, index) => (
              <label
                key={index}
                className={`border-2 rounded-lg p-1 flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                  selectedArrivalTimeRangesCity2.includes(item.value)
                    ? "border-blue bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedArrivalTimeRangesCity2.includes(item.value)}
                  onChange={() => {
                    setSelectedArrivalTimeRangesCity2((prev) =>
                      prev.includes(item.value)
                        ? prev.filter(time => time !== item.value)
                        : [...prev, item.value]
                    );
                  }}
                />
                <img
                  src={item.image}
                  alt="Flight time"
                  className="w-6 h-6 object-contain"
                  width={24}
                  height={24}
                />
                <span className="text-xs font-medium">{item.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Return Journey (if applicable) */}
      {apiReturnDate && (
        <div className="mb-6">
          <h2 className="mb-3 font-bold inline-block border-b-4 border-yellow-500 w-fit">
            Return Journey
          </h2>
          
          {/* Stops */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">
              Stops From {destinationName}
            </h3>
            <div className="space-y-2">
              {["Non-Stop", "1-Stop"].map((stopType) => (
                <div key={stopType} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`return-${stopType.toLowerCase().replace(' ', '-')}`}
                    className="h-4 w-4 text-orange-500 rounded focus:ring-orange-500 border-gray-300"
                    onChange={(e) => handleReturnStopChange(e, stopType)}
                  />
                  <label 
                    htmlFor={`return-${stopType.toLowerCase().replace(' ', '-')}`}
                    className="text-gray-600 font-medium"
                  >
                    {stopType}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Departure Times */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">
              Departure From {destinationName}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {Time.map((item, index) => (
                <label
                  key={index}
                  className={`border-2 rounded-lg p-1 flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                    selectedDepartureTimeRangesCity2.includes(item.value)
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedDepartureTimeRangesCity2.includes(item.value)}
                    onChange={() => {
                      setSelectedDepartureTimeRangesCity2((prev) =>
                        prev.includes(item.value)
                          ? prev.filter(time => time !== item.value)
                          : [...prev, item.value]
                      );
                    }}
                  />
                  <img
                    src={item.image}
                    alt="Flight time"
                    className="w-6 h-6 object-contain"
                    width={24}
                    height={24}
                  />
                  <span className="text-xs font-medium">{item.name}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Arrival Times */}
          <div>
            <h3 className="text-sm font-semibold mb-2">
              Arrival at {originName}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {Time.map((item, index) => (
                <label
                  key={index}
                  className={`border-2 rounded-lg p-1 flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                    selectedArrivalTimeRangesCity1.includes(item.value)
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedArrivalTimeRangesCity1.includes(item.value)}
                    onChange={() => {
                      setSelectedArrivalTimeRangesCity1((prev) =>
                        prev.includes(item.value)
                          ? prev.filter(time => time !== item.value)
                          : [...prev, item.value]
                      );
                    }}
                  />
                  <img
                    src={item.image}
                    alt="Flight time"
                    className="w-6 h-6 object-contain"
                    width={24}
                    height={24}
                  />
                  <span className="text-xs font-medium">{item.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Airlines */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Airlines</h3>
        <div className="space-y-3">
          {airlineDetails.map((airline) => (
            <div key={airline.airlineCode} className="flex items-center gap-3">
              <input
                type="checkbox"
                id={airline.airlineCode}
                className="h-4 w-4 text-orange-500 rounded focus:ring-orange-500 border-gray-300"
                onChange={(e) => handleCheckboxChange(e, airline.airlineCode)}
              />
              <label 
                htmlFor={airline.airlineCode}
                className="flex items-center gap-2 flex-1"
              >
                <img
                  src={airline.airlineImage}
                  className="w-6 h-6 object-contain"
                  width={24}
                  height={24}
                  alt={`${airline.airlineName} Logo`}
                />
                <span className="text-gray-600 font-medium">
                  {airline.airlineName}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</aside>
            <div className="md:w-3/4 lg:w-3/4">
              <div className="">
                {!flights.OneWay && (
                  <div className="flex md:hidden sticky top-0 z-10 px-2 py-1 w-full border-b justify-between items-center">
                    <div className="flex flex-col gap-2 w-[60%]">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-black">
                          <img
                            src={selectedOnward?.AirlineImage}
                            className="h-6 w-6"
                            alt="Departure Airline"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-sm">
                              {selectedOnward?.ApiNo === 1 ? (
                                <p>
                                  {
                                    selectedOnward?.Origin?.DepartTime.split(
                                      " "
                                    )[1]
                                  }{" "}
                                  →{" "}
                                  {
                                    selectedOnward?.Destination?.ArrivalTime.split(
                                      " "
                                    )[1]
                                  }
                                </p>
                              ) : (
                                <p>
                                  {
                                    selectedOnward?.Additional1?.sagment?.[0]?.dt?.split(
                                      "T"
                                    )[1]
                                  }{" "}
                                  →{" "}
                                  {
                                    selectedOnward?.Additional1.sagment[
                                      selectedOnward.Additional1.sagment
                                        .length - 1
                                    ]?.at.split("T")[1]
                                  }
                                </p>
                              )}
                            </div>
                            <div className="flex gap-8 text-xs text-gray-600 mt-1">
                              {" "}
                              {/* Added margin-top */}
                              <span>
                                {selectedOnward?.ApiNo === 1
                                  ? selectedOnward?.Additional1?.sagment?.[0]
                                      ?.Origin ?? "N/A"
                                  : selectedOnward?.Additional1?.sagment?.[0]
                                      ?.da?.code ?? "N/A"}
                              </span>
                              <span>
                                {selectedOnward?.ApiNo === 1
                                  ? selectedOnward?.Additional1?.sagment?.length
                                    ? selectedOnward.Additional1.sagment[
                                        selectedOnward.Additional1.sagment
                                          .length - 1
                                      ].Destination
                                    : "N/A"
                                  : selectedOnward?.Additional1?.sagment?.length
                                  ? selectedOnward.Additional1.sagment[
                                      selectedOnward.Additional1.sagment
                                        .length - 1
                                    ].aa.code
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-black">
                          <img
                            src={selectedReturn?.AirlineImage}
                            className="h-6 w-6"
                            alt="Return Airline"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-sm">
                              {selectedReturn?.ApiNo === 1 ? (
                                <p>
                                  {
                                    selectedReturn?.Origin?.DepartTime.split(
                                      " "
                                    )[1]
                                  }{" "}
                                  →{" "}
                                  {
                                    selectedReturn?.Destination?.ArrivalTime.split(
                                      " "
                                    )[1]
                                  }
                                </p>
                              ) : (
                                <p>
                                  {
                                    selectedReturn?.Additional1?.sagment?.[0]?.dt?.split(
                                      "T"
                                    )[1]
                                  }{" "}
                                  →{" "}
                                  {
                                    selectedReturn?.Additional1.sagment[
                                      selectedReturn.Additional1.sagment
                                        .length - 1
                                    ]?.at.split("T")[1]
                                  }
                                </p>
                              )}
                            </div>
                            <div className="flex gap-8 text-xs text-gray-600 mt-1">
                              {" "}
                              {/* Added margin-top */}
                              <span>
                                {selectedReturn?.ApiNo === 1
                                  ? selectedReturn?.Additional1?.sagment?.[0]
                                      ?.Origin ?? "N/A"
                                  : selectedReturn?.Additional1?.sagment?.[0]
                                      ?.da?.code ?? "N/A"}
                              </span>
                              <span>
                                {selectedReturn?.ApiNo === 1
                                  ? selectedReturn?.Additional1?.sagment?.length
                                    ? selectedReturn.Additional1.sagment[
                                        selectedReturn.Additional1.sagment
                                          .length - 1
                                      ].Destination
                                    : "N/A"
                                  : selectedReturn?.Additional1?.sagment?.length
                                  ? selectedReturn.Additional1.sagment[
                                      selectedReturn.Additional1.sagment
                                        .length - 1
                                    ].aa.code
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fare Info */}
                    <div className="flex flex-col items-end gap-2">
                      <h2 className="text-lg font-bold text-black">
                        ₹ {totalFare.toLocaleString()}
                      </h2>
                      <button
                        className="bg-yellow text-white font-semibold px-4 py-2 rounded-lg shadow text-sm w-full"
                        onClick={() =>
                          handleOpenModal(selectedOnward, selectedReturn)
                        }
                      >
                        Proceed
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {flights.OneWay && (
                <div className="flex items-center bg-white rounded-lg shadow-lg">
                  <button
                    onClick={() =>
                      document.getElementById("scrollable-container").scrollBy({
                        left: -100,
                        behavior: "smooth",
                      })
                    }
                    className="pl-4 h-16 w-16 md:w-10 md:h-10"
                  >
                    <Image
                      src="/icons/leftArrow.png"
                      width={16}
                      height={16}
                      alt="Flight img"
                    />
                  </button>

                  <div
                    id="scrollable-container"
                    className="overflow-x-auto whitespace-nowrap flex items-center mx-4 px-1 scrollbar-hide"
                    style={{ scrollBehavior: "smooth" }}
                  >
                    {datePrice.map((item) => (
                      <div
                        key={item.id}
                        className={`flex justify-between items-center px-4 py-2 border-r text-xs flex-col sm:w-auto w-full ${
                          format(selectedDate, "EEE, dd MMM") === item.id
                            ? "border-b-yellow border-b-4"
                            : ""
                        }`}
                        onClick={() => handleSelectDate(item.id, item.price)}
                      >
                        <p className="text-neutral-400 font-medium text-sm">
                          {item.id}
                        </p>
                        <p className="font-medium text-sm">{item.price}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      document.getElementById("scrollable-container").scrollBy({
                        left: 100,
                        behavior: "smooth",
                      })
                    }
                    className="pr-4 h-16 w-16 md:w-10 md:h-10"
                  >
                    <Image
                      src="/icons/rightArrow.png"
                      width={16}
                      height={16}
                      alt="Flight img"
                    />
                  </button>
                </div>
              )}
              {loading ? (
                <Simmer />
              ) : (
                <div className="relative items-center mb-28">
                  {flights.OneWay ? (
                    <div className="mt-4 grid grid-cols-1 gap-4">
                      <div className="flex flex-col gap-2">
                        {flights.OneWay.filter((flight) => {
                          const minPrice = Math.min(
                            ...flight.Amount.map((a) => {
                              if (a.FareDetails) {
                                return Math.min(
                                  ...a.FareDetails.map((f) => f.Total_Amount)
                                );
                              } else if (
                                a.fd &&
                                a.fd.ADULT &&
                                a.fd.ADULT.fC &&
                                a.fd.ADULT.fC.TF
                              ) {
                                return a.fd.ADULT.fC.TF;
                              }
                              return Infinity;
                            })
                          );
                          const isDirect = isDirectFlight(flight);
                          return (
                            minPrice <= selectedPrice &&
                            isTimeWithinRanges(
                              flight,
                              selectedDepartureTimeRangesCity1
                            ) &&
                            isTimeWithinRanges(
                              flight,
                              selectedArrivalTimeRangesCity2,
                              true
                            ) &&
                            (selectedAirlines.length === 0 ||
                              selectedAirlines.includes(flight.AirlineCode)) &&
                            (selectedOnwardStops.length === 0 ||
                              (isDirect &&
                                selectedOnwardStops.includes("Non-Stop")) ||
                              (!isDirect &&
                                selectedOnwardStops.includes("1-Stop")))
                          );
                        }).map((flight, index) => {
                          const calculateTotalDuration = (flight) => {
                            let totalMinutes = 0;

                            if (flight.ApiNo === 1) {
                              // For ApiNo === 1: Sum durations from segments using the "Duration" field
                              if (
                                flight.Additional1 &&
                                flight.Additional1.sagment
                              ) {
                                flight.Additional1.sagment.forEach(
                                  (segment) => {
                                    const [hours, minutes] =
                                      segment.Duration.split(":");
                                    totalMinutes +=
                                      parseInt(hours) * 60 + parseInt(minutes);
                                  }
                                );
                              }
                            } else if (flight.ApiNo === 2) {
                              // For ApiNo === 2: Sum durations from segments using the "duration" field
                              if (
                                flight.Additional1 &&
                                flight.Additional1.sagment
                              ) {
                                flight.Additional1.sagment.forEach(
                                  (segment) => {
                                    totalMinutes += segment.duration;
                                  }
                                );
                              }
                            } else {
                              return "N/A"; // Handle cases where duration data is missing
                            }

                            const hours = Math.floor(totalMinutes / 60);
                            const minutes = totalMinutes % 60;
                            return `${hours}h ${minutes}m`;
                          };

                          // Calculate the total duration
                          const totalDuration = calculateTotalDuration(flight);

                          return (
                            <motion.div
                              key={flight.ApiId}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: index * 0.05,
                                duration: 0.3,
                              }}
                              whileHover={{ scale: 1.02 }}
                              className="bg-white rounded-2xl shadow-lg transition-all hover:shadow-xl cursor-pointer mx-1"
                              onClick={() => {
                                setSelectedOnward(flight);
                                handleOpenModal(flight);
                              }}
                            >
                              <div className="flex flex-col">
                                <div className="md:py-4 md:px-4 flex items-center md:justify-between py-3 px-3 ">
                                  <div className="flex md:flex-row flex-col items-center md:justify-between justify-start  w-full ">
                                    <div className="flex items-center md:flex-col flex-row gap-5   md:px-0">
                                      <div className="flex md:flex-row  items-center justify-start w-full gap-3  ">
                                        <img
                                          src={flight.AirlineImage}
                                          width="40"
                                          height="40"
                                          loading="eager"
                                          style={{
                                            objectFit: "contain",
                                            imageRendering: "auto",
                                            borderRadius: "4px",
                                          }}
                                          alt="Airline Logo"
                                          className="hidden md:block"
                                        />

                                        <div className="flex md:flex-col flex-row justify-start w-full gap-1" >
                                          <h2 className="md:font-semibold md:text-lg">
                                            {flight.AirlineName}
                                          </h2>
                                          <p className="md:hidden"> • </p>
                                          <AirlineDetails
                                            airlineName={flight.AirlineName}
                                            AirlineCode={flight.AirlineCode}
                                            FlightNumber={flight.FlightNumber}
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 md:w-3/4 w-full px-3 md:px-0">
                                      <img
                                        src={flight.AirlineImage}
                                        width="30"
                                        height="30"
                                        loading="eager"
                                        style={{
                                          objectFit: "contain",
                                          imageRendering: "auto",
                                          borderRadius: "4px",
                                        }}
                                        alt="Airline Logo"
                                        className="md:hidden block"
                                      />
                                      <div className="flex items-center md:justify-between md:w-3/4 md:pr-16 md:gap-5 gap-6">
                                        <div>
                                          <p className="md:text-lg text-sm font-semibold">
                                            {flight.ApiNo === 1
                                              ? flight.Origin.DepartTime.split(
                                                  " "
                                                )[1]
                                              : flight?.Additional1?.sagment?.[0]?.dt?.split(
                                                  "T"
                                                )[1]}
                                          </p>
                                          <p className="md:text-xs text-xs font-medium">
                                            {flight.ApiNo === 1
                                              ? flight?.Additional1
                                                  ?.sagment?.[0]?.Origin ??
                                                "N/A"
                                              : flight?.Additional1
                                                  ?.sagment?.[0]?.da?.code ??
                                                "N/A"}
                                          </p>
                                        </div>
                                        <div className="text-center flex items-center w-full gap-4">
                                          <div className="flex flex-col items-center w-full">
                                            <div className="flex items-center w-full">
                                              <span className="border-b-2 border-gray border-dashed w-full hidden md:block"></span>
                                              <div className="flex flex-col items-center gap-1 md:gap-3 w-full">
                                                <p className="text-sm text-gray-500">
                                                  {totalDuration}
                                                </p>
                                                <img
                                                  src="/icons/flightList.png"
                                                  alt="Flight Icon"
                                                  className="hidden md:block"
                                                />
                                                <span className="border-b-2 border-gray  w-full md:hidden"></span>
                                                <p className="text-xs text-gray-500 text-blue">
                                                  {flight?.Additional1?.sagment
                                                    ?.length > 1
                                                    ? `${
                                                        flight.Additional1
                                                          .sagment.length - 1
                                                      } stop${
                                                        flight.Additional1
                                                          .sagment.length -
                                                          1 >
                                                        1
                                                          ? "s"
                                                          : ""
                                                      } via ${flight.Additional1.sagment
                                                        .slice(0, -1)
                                                        .map(
                                                          (seg) =>
                                                            seg.Destination_City ||
                                                            seg.aa?.city ||
                                                            seg.aa?.cityCode ||
                                                            seg.da?.code
                                                        )
                                                        .join(", ")}`
                                                    : "Non-stop"}
                                                </p>
                                              </div>
                                              <span className="border-b-2 border-gray border-dashed w-full hidden md:block"></span>
                                            </div>
                                          </div>
                                        </div>

                                        <div>
                                          <p className="md:text-lg text-sm font-semibold">
                                            {flight.ApiNo === 1
                                              ? flight.Destination.ArrivalTime.split(
                                                  " "
                                                )[1]
                                              : flight.Additional1.sagment[
                                                  flight.Additional1.sagment
                                                    .length - 1
                                                ]?.at.split("T")[1]}
                                          </p>
                                          <p className="md:text-xs text-xs font-medium">
                                            {flight.ApiNo === 1
                                              ? flight?.Additional1?.sagment
                                                  ?.length
                                                ? flight.Additional1.sagment[
                                                    flight.Additional1.sagment
                                                      .length - 1
                                                  ].Destination
                                                : "N/A"
                                              : flight?.Additional1?.sagment
                                                  ?.length
                                              ? flight.Additional1.sagment[
                                                  flight.Additional1.sagment
                                                    .length - 1
                                                ].aa.code
                                              : "N/A"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right flex flex-col">
                                    <p className="text-lg font-semibold">
                                      ₹
                                      {Math.min(
                                        ...flight.Amount.map((a) => {
                                          if (
                                            a.FareDetails &&
                                            a.FareDetails.length > 0
                                          ) {
                                            return a.FareDetails[0]
                                              .Total_Amount;
                                          } else if (
                                            a.fd &&
                                            a.fd.ADULT &&
                                            a.fd.ADULT.fC &&
                                            a.fd.ADULT.fC.TF
                                          ) {
                                            return a.fd.ADULT.fC.TF;
                                          }
                                          return Infinity;
                                        })
                                      ).toLocaleString()}
                                    </p>
                                    <button
                                      className="bg-yellow text-white font-semibold py-2 rounded-lg border border-yellow w-32 ml-auto hidden md:block"
                                      onClick={() => {
                                        setSelectedOnward(flight);
                                        handleOpenModal(flight);
                                      }}
                                    >
                                      Book Now
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-2 md:gap-4 gap-1 mx-1">
                      {/* Onward Flights */}
                      <div>
                        <h2 className="text-xl font-semibold mb-2 hidden md:block">
                          {originName} → {destinationName}
                          <span className="font-light text-sm">
                            {formattedTravelDateShort}
                          </span>
                        </h2>
                        <h2 className="md:text-xl text-sm font-semibold mb-2 md:hidden">
                          {originDropdown.code} → {destinationDropdown.code}{" "}
                          <span className="font-light md:text-sm text-xs">
                            {formattedTravelDateShort}
                          </span>
                        </h2>
                        <div className="flex flex-col gap-2">
                          {flights?.data?.FlightOnward?.filter((flight) => {
                            const minPrice = Math.min(
                              ...flight.Amount.map((a) => {
                                if (a.FareDetails) {
                                  return Math.min(
                                    ...a.FareDetails.map((f) => f.Total_Amount)
                                  );
                                } else if (
                                  a.fd &&
                                  a.fd.ADULT &&
                                  a.fd.ADULT.fC &&
                                  a.fd.ADULT.fC.TF
                                ) {
                                  return a.fd.ADULT.fC.TF;
                                }
                                return Infinity;
                              })
                            );
                            const isDirect = isDirectFlight(flight);
                            return (
                              minPrice <= selectedPrice &&
                              isTimeWithinRanges(
                                flight,
                                selectedDepartureTimeRangesCity1
                              ) &&
                              isTimeWithinRanges(
                                flight,
                                selectedArrivalTimeRangesCity2,
                                true
                              ) &&
                              (selectedAirlines.length === 0 ||
                                selectedAirlines.includes(
                                  flight.AirlineCode
                                )) &&
                              (selectedOnwardStops.length === 0 ||
                                (isDirect &&
                                  selectedOnwardStops.includes("Non-Stop")) ||
                                (!isDirect &&
                                  selectedOnwardStops.includes("1-Stop")))
                            );
                          }).map((flight, index) => {
                            const calculateTotalDuration = (flight) => {
                              let totalMinutes = 0;

                              if (flight.ApiNo === 1) {
                                // For ApiNo === 1: Sum durations from segments using the "Duration" field
                                if (
                                  flight.Additional1 &&
                                  flight.Additional1.sagment
                                ) {
                                  flight.Additional1.sagment.forEach(
                                    (segment) => {
                                      const [hours, minutes] =
                                        segment.Duration.split(":");
                                      totalMinutes +=
                                        parseInt(hours) * 60 +
                                        parseInt(minutes);
                                    }
                                  );
                                }
                              } else if (flight.ApiNo === 2) {
                                // For ApiNo === 2: Sum durations from segments using the "duration" field
                                if (
                                  flight.Additional1 &&
                                  flight.Additional1.sagment
                                ) {
                                  flight.Additional1.sagment.forEach(
                                    (segment) => {
                                      totalMinutes += segment.duration;
                                    }
                                  );
                                }
                              } else {
                                return "N/A"; // Handle cases where duration data is missing
                              }

                              const hours = Math.floor(totalMinutes / 60);
                              const minutes = totalMinutes % 60;
                              return `${hours}h ${minutes}m`;
                            };

                            // Calculate the total duration
                            const totalDuration =
                              calculateTotalDuration(flight);
                            return (
                              <motion.div
                                key={flight.ApiId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: index * 0.01,
                                  duration: 0.1,
                                }}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => setSelectedOnward(flight)}
                                className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer border-2 transition-all duration-150 ${
                                  selectedOnward?.ApiId === flight.ApiId
                                    ? "border-blue bg-blue/5"
                                    : "border-transparent"
                                }`}
                              >
                                <div className="md:p-4 flex items-center justify-between md:flex-row flex-col">
                                  <div className="flex   md:flex-col flex-row gap-1 w-full md:p-0 p-1 ">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={flight.AirlineImage}
                                        width="30"
                                        height="30"
                                        loading="eager"
                                        style={{
                                          objectFit: "contain",
                                          imageRendering: "auto",
                                          borderRadius: "4px",
                                        }}
                                        alt="Airline Logo"
                                        className="md:w-8 w-6"
                                      />
                                      <h2 className="md:font-semibold md:text-lg">
                                        {flight.AirlineName} 
                                      </h2>
                                    </div>
                                    <AirlineDetails
                                      AirlineCode={flight.AirlineCode}
                                      FlightNumber={flight.FlightNumber}
                                      seatAvailability={
                                        flight.Amount.Seats_Available
                                      }
                                    />  
                                  </div>

                                  <div className="text-center w-full md:p-0 p-1">
                                    <div className="flex items-center md:justify-center justify-between gap-5 ">
                                      <div>
                                        <p className="md:text-lg text-sm font-medium md:font-semibold">
                                          {flight.ApiNo === 1
                                            ? flight.Origin.DepartTime.split(
                                                " "
                                              )[1]
                                            : flight?.Additional1?.sagment?.[0]?.dt?.split(
                                                "T"
                                              )[1]}
                                        </p>
                                        <p className="text-xs font-medium">
                                          {flight.ApiNo === 1
                                            ? flight?.Additional1?.sagment?.[0]
                                                ?.Origin ?? "N/A"
                                            : flight?.Additional1?.sagment?.[0]
                                                ?.da?.code ?? "N/A"}
                                        </p>
                                      </div>
                                      <div className="text-center flex flex-col items-center md:gap-1">
                                        <p className="text-sm text-gray-500">
                                          {totalDuration}
                                        </p>
                                        <span className="border border-yellow w-16 h-0"></span>
                                        <p className="text-xs text-gray-500 text-blue">
                                          {flight?.Additional1?.sagment
                                            ?.length > 1
                                            ? `${
                                                flight.Additional1.sagment
                                                  .length - 1
                                              } stop${
                                                flight.Additional1.sagment
                                                  .length -
                                                  1 >
                                                1
                                                  ? "s"
                                                  : ""
                                              } via ${flight.Additional1.sagment
                                                .slice(0, -1)
                                                .map(
                                                  (seg) =>
                                                    seg.Destination_City ||
                                                    seg.aa?.city ||
                                                    seg.aa?.cityCode ||
                                                    seg.da?.code
                                                )
                                                .join(", ")}`
                                            : "Non-stop"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="md:text-lg text-sm font-medium md:font-semibold">
                                          {flight.ApiNo === 1
                                            ? flight.Destination.ArrivalTime.split(
                                                " "
                                              )[1]
                                            : flight.Additional1.sagment[
                                                flight.Additional1.sagment
                                                  .length - 1
                                              ]?.at.split("T")[1]}
                                        </p>
                                        <p className="text-xs font-medium">
                                          {flight.ApiNo === 1
                                            ? flight?.Additional1?.sagment
                                                ?.length
                                              ? flight.Additional1.sagment[
                                                  flight.Additional1.sagment
                                                    .length - 1
                                                ].Destination
                                              : "N/A"
                                            : flight?.Additional1?.sagment
                                                ?.length
                                            ? flight.Additional1.sagment[
                                                flight.Additional1.sagment
                                                  .length - 1
                                              ].aa.code
                                            : "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right flex items-center justify-between w-full md:gap-10">
                                    <div className="flex items-center justify-between md:justify-end w-full px-1 md:px-0">
                                      <p className="md:hidden text-sm font-medium">
                                        Economy
                                      </p>
                                      <span className="flex items-center gap-1 md:flex-col flex-row">
                                        <p className="md:text-lg text-sm font-semibold">
                                          ₹{" "}
                                          {Math.min(
                                            ...flight.Amount.map((a) => {
                                              if (
                                                a.FareDetails &&
                                                a.FareDetails.length > 0
                                              ) {
                                                return a.FareDetails[0]
                                                  .Total_Amount;
                                              } else if (
                                                a.fd &&
                                                a.fd.ADULT &&
                                                a.fd.ADULT.fC &&
                                                a.fd.ADULT.fC.TF
                                              ) {
                                                return a.fd.ADULT.fC.TF;
                                              }
                                              return Infinity;
                                            })
                                          ).toLocaleString()}
                                        </p>
                                        <p className="text-[12px] text-gray">
                                          per adult
                                        </p>
                                      </span>
                                    </div>
                                    <input
                                      type="radio"
                                      name="onward"
                                      checked={
                                        selectedOnward?.ApiId === flight.ApiId
                                      }
                                      onChange={() => setSelectedOnward(flight)}
                                      className="accent-yellow-500 w-8 h-8 md:block hidden"
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Return Flights */}
                      <div>
                        <h2 className="text-xl font-semibold mb-2 hidden md:block">
                          {destinationName} → {originName}
                          <span className="font-light text-sm">
                            {formattedReturnDateShort}
                          </span>
                        </h2>
                        <h2 className="md:text-xl text-sm font-semibold mb-2 md:hidden">
                          {destinationDropdown.code} → {originDropdown.code}{" "}
                          <span className="font-light md:text-sm text-xs">
                            {formattedReturnDateShort}
                          </span>
                        </h2>
                        <div className="flex flex-col gap-2">
                          {flights?.data?.FlightReturn?.filter((flight) => {
                            const minPrice = Math.min(
                              ...flight.Amount.map((a) => {
                                if (a.FareDetails) {
                                  return Math.min(
                                    ...a.FareDetails.map((f) => f.Total_Amount)
                                  );
                                } else if (
                                  a.fd &&
                                  a.fd.ADULT &&
                                  a.fd.ADULT.fC &&
                                  a.fd.ADULT.fC.TF
                                ) {
                                  return a.fd.ADULT.fC.TF;
                                }
                                return Infinity;
                              })
                            );
                            const isDirect = isDirectFlight(flight);
                            return (
                              minPrice <= selectedPrice &&
                              isTimeWithinRanges(
                                flight,
                                selectedDepartureTimeRangesCity2
                              ) &&
                              isTimeWithinRanges(
                                flight,
                                selectedArrivalTimeRangesCity1,
                                true
                              ) &&
                              (selectedAirlines.length === 0 ||
                                selectedAirlines.includes(
                                  flight.AirlineCode
                                )) &&
                              (selectedReturnStops.length === 0 ||
                                (isDirect &&
                                  selectedReturnStops.includes("Non-Stop")) ||
                                (!isDirect &&
                                  selectedReturnStops.includes("1-Stop")))
                            );
                          }).map((flight, index) => {
                            const calculateTotalDuration = (flight) => {
                              let totalMinutes = 0;

                              if (flight.ApiNo === 1) {
                                // For ApiNo === 1: Sum durations from segments using the "Duration" field
                                if (
                                  flight.Additional1 &&
                                  flight.Additional1.sagment
                                ) {
                                  flight.Additional1.sagment.forEach(
                                    (segment) => {
                                      const [hours, minutes] =
                                        segment.Duration.split(":");
                                      totalMinutes +=
                                        parseInt(hours) * 60 +
                                        parseInt(minutes);
                                    }
                                  );
                                }
                              } else if (flight.ApiNo === 2) {
                                // For ApiNo === 2: Sum durations from segments using the "duration" field
                                if (
                                  flight.Additional1 &&
                                  flight.Additional1.sagment
                                ) {
                                  flight.Additional1.sagment.forEach(
                                    (segment) => {
                                      totalMinutes += segment.duration;
                                    }
                                  );
                                }
                              } else {
                                return "N/A"; // Handle cases where duration data is missing
                              }

                              const hours = Math.floor(totalMinutes / 60);
                              const minutes = totalMinutes % 60;
                              return `${hours}h ${minutes}m`;
                            };

                            // Calculate the total duration
                            const totalDuration =
                              calculateTotalDuration(flight);
                            return (
                              <motion.div
                                key={flight.ApiId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: index * 0.01,
                                  duration: 0.1,
                                }}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => setSelectedReturn(flight)}
                                className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer border-2 transition-all duration-150 ${
                                  selectedReturn?.ApiId === flight.ApiId
                                    ? "border-blue bg-blue/5"
                                    : "border-transparent"
                                }`}
                              >
                                <div className="md:p-4 flex items-center justify-between md:flex-row flex-col">
                                  <div className="flex   md:flex-col flex-row gap-1 w-full md:p-0 p-1 ">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={flight.AirlineImage}
                                        width="30"
                                        height="30"
                                        loading="eager"
                                        style={{
                                          objectFit: "contain",
                                          imageRendering: "auto",
                                          borderRadius: "4px",
                                        }}
                                        alt="Airline Logo"
                                        className="md:w-8 w-6"
                                      />
                                      <h2 className="md:font-semibold md:text-lg">
                                        {flight.AirlineName}
                                      </h2>
                                    </div>
                                    <AirlineDetails
                                      AirlineCode={flight.AirlineCode}
                                      FlightNumber={flight.FlightNumber}
                                      seatAvailability={
                                        flight.Amount.Seats_Available
                                      }
                                    />
                                  </div>

                                  <div className="text-center w-full md:p-0 p-1">
                                    <div className="flex items-center md:justify-center justify-between gap-5 ">
                                      <div>
                                        <p className="md:text-lg text-sm font-medium md:font-semibold">
                                          {flight.ApiNo === 1
                                            ? flight.Origin.DepartTime.split(
                                                " "
                                              )[1]
                                            : flight?.Additional1?.sagment?.[0]?.dt?.split(
                                                "T"
                                              )[1]}
                                        </p>
                                        <p className="text-xs font-medium">
                                          {flight.ApiNo === 1
                                            ? flight?.Additional1?.sagment?.[0]
                                                ?.Origin ?? "N/A"
                                            : flight?.Additional1?.sagment?.[0]
                                                ?.da?.code ?? "N/A"}
                                        </p>
                                      </div>
                                      <div className="text-center flex flex-col items-center md:gap-1">
                                        <p className="text-sm text-gray-500">
                                          {totalDuration}
                                        </p>
                                        <span className="border border-yellow w-16 h-0"></span>
                                        <p className="text-xs text-gray-500 text-blue">
                                          {flight?.Additional1?.sagment
                                            ?.length > 1
                                            ? `${
                                                flight.Additional1.sagment
                                                  .length - 1
                                              } stop${
                                                flight.Additional1.sagment
                                                  .length -
                                                  1 >
                                                1
                                                  ? "s"
                                                  : ""
                                              } via ${flight.Additional1.sagment
                                                .slice(0, -1)
                                                .map(
                                                  (seg) =>
                                                    seg.Destination_City ||
                                                    seg.aa?.city ||
                                                    seg.aa?.cityCode ||
                                                    seg.da?.code
                                                )
                                                .join(", ")}`
                                            : "Non-stop"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="md:text-lg text-sm font-medium md:font-semibold">
                                          {flight.ApiNo === 1
                                            ? flight.Destination.ArrivalTime.split(
                                                " "
                                              )[1]
                                            : flight.Additional1.sagment[
                                                flight.Additional1.sagment
                                                  .length - 1
                                              ]?.at.split("T")[1]}
                                        </p>
                                        <p className="text-xs font-medium">
                                          {flight.ApiNo === 1
                                            ? flight?.Additional1?.sagment
                                                ?.length
                                              ? flight.Additional1.sagment[
                                                  flight.Additional1.sagment
                                                    .length - 1
                                                ].Destination
                                              : "N/A"
                                            : flight?.Additional1?.sagment
                                                ?.length
                                            ? flight.Additional1.sagment[
                                                flight.Additional1.sagment
                                                  .length - 1
                                              ].aa.code
                                            : "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right flex items-center justify-between w-full md:gap-10">
                                    <div className="flex items-center justify-between md:justify-end w-full px-1 md:px-0">
                                      <p className="md:hidden text-sm font-medium">
                                        Economy
                                      </p>
                                      <span className="flex items-center gap-1 md:flex-col flex-row">
                                        <p className="md:text-lg text-sm font-semibold">
                                          ₹{" "}
                                          {Math.min(
                                            ...flight.Amount.map((a) => {
                                              if (
                                                a.FareDetails &&
                                                a.FareDetails.length > 0
                                              ) {
                                                return a.FareDetails[0]
                                                  .Total_Amount;
                                              } else if (
                                                a.fd &&
                                                a.fd.ADULT &&
                                                a.fd.ADULT.fC &&
                                                a.fd.ADULT.fC.TF
                                              ) {
                                                return a.fd.ADULT.fC.TF;
                                              }
                                              return Infinity;
                                            })
                                          ).toLocaleString()}
                                        </p>
                                        <p className="text-[12px] text-gray">
                                          per adult
                                        </p>
                                      </span>
                                    </div>
                                    <input
                                      type="radio"
                                      name="return"
                                      checked={
                                        selectedReturn?.ApiId === flight.ApiId
                                      }
                                      onChange={() => setSelectedReturn(flight)}
                                      className="accent-yellow-500 w-8 h-8 md:block hidden"
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {!flights.OneWay && (
                    <div className="hidden md:flex fixed bottom-0 w-full md:w-[58%] bg-blueLight border-2 border-blue border-b-transparent p-4 justify-between items-center text-white shadow-lg rounded-t-xl ">
                      {/* Flight Info */}
                      <div className="flex gap-8">
                        <div>
                          <p className="font-semibold text-gray">
                            Departure ・ {selectedOnward?.AirlineName}
                          </p>
                          <div className="flex items-center gap-4 text-lg text-black">
                            <img src={selectedOnward?.AirlineImage} />
                            <div>
                              <div className="font-semibold text-lg">
                                {selectedOnward?.ApiNo === 1 ? (
                                  <p>
                                    {
                                      selectedOnward?.Origin?.DepartTime.split(
                                        " "
                                      )[1]
                                    }{" "}
                                    →{" "}
                                    {
                                      selectedOnward?.Destination?.ArrivalTime.split(
                                        " "
                                      )[1]
                                    }
                                  </p>
                                ) : (
                                  <p>
                                    {
                                      selectedOnward?.Additional1?.sagment?.[0]?.dt?.split(
                                        "T"
                                      )[1]
                                    }{" "}
                                    →{" "}
                                    {
                                      selectedOnward?.Additional1.sagment[
                                        selectedOnward.Additional1.sagment
                                          .length - 1
                                      ]?.at.split("T")[1]
                                    }
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <p>
                                  {selectedOnward?.ApiNo === 1
                                    ? selectedOnward?.Additional1?.sagment?.[0]
                                        ?.Origin ?? "N/A"
                                    : selectedOnward?.Additional1?.sagment?.[0]
                                        ?.da?.code ?? "N/A"}
                                </p>
                                <p>
                                  {selectedOnward?.ApiNo === 1
                                    ? selectedOnward?.Additional1?.sagment
                                        ?.length
                                      ? selectedOnward.Additional1.sagment[
                                          selectedOnward.Additional1.sagment
                                            .length - 1
                                        ].Destination
                                      : "N/A"
                                    : selectedOnward?.Additional1?.sagment
                                        ?.length
                                    ? selectedOnward.Additional1.sagment[
                                        selectedOnward.Additional1.sagment
                                          .length - 1
                                      ].aa.code
                                    : "N/A"}
                                </p>
                              </div>
                              <p>
                                ₹{" "}
                                {selectedOnward?.Amount
                                  ? getMinFareFromAmount(
                                      selectedOnward.Amount
                                    ).toLocaleString()
                                  : "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="w-px bg-gray h-auto mx-4" />
                        <div>
                          <p className="font-semibold text-gray">
                            Return ・ {selectedReturn?.AirlineName}
                          </p>
                          <div className="flex items-center gap-4 text-lg text-black">
                            <img src={selectedReturn?.AirlineImage} />
                            <div>
                              <div className="font-semibold text-lg">
                                {selectedReturn?.ApiNo === 1 ? (
                                  <p>
                                    {
                                      selectedReturn?.Origin?.DepartTime.split(
                                        " "
                                      )[1]
                                    }{" "}
                                    →{" "}
                                    {
                                      selectedReturn?.Destination?.ArrivalTime.split(
                                        " "
                                      )[1]
                                    }
                                  </p>
                                ) : (
                                  <p>
                                    {
                                      selectedReturn?.Additional1?.sagment?.[0]?.dt?.split(
                                        "T"
                                      )[1]
                                    }{" "}
                                    →{" "}
                                    {
                                      selectedReturn?.Additional1.sagment[
                                        selectedReturn.Additional1.sagment
                                          .length - 1
                                      ]?.at.split("T")[1]
                                    }
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <p>
                                  {selectedReturn?.ApiNo === 1
                                    ? selectedReturn?.Additional1?.sagment?.[0]
                                        ?.Origin ?? "N/A"
                                    : selectedReturn?.Additional1?.sagment?.[0]
                                        ?.da?.code ?? "N/A"}
                                </p>
                                <p>
                                  {selectedReturn?.ApiNo === 1
                                    ? selectedReturn?.Additional1?.sagment
                                        ?.length
                                      ? selectedReturn.Additional1.sagment[
                                          selectedReturn.Additional1.sagment
                                            .length - 1
                                        ].Destination
                                      : "N/A"
                                    : selectedReturn?.Additional1?.sagment
                                        ?.length
                                    ? selectedReturn.Additional1.sagment[
                                        selectedReturn.Additional1.sagment
                                          .length - 1
                                      ].aa.code
                                    : "N/A"}
                                </p>
                              </div>
                              <p>
                                ₹{" "}
                                {selectedReturn?.Amount
                                  ? getMinFareFromAmount(
                                      selectedReturn.Amount
                                    ).toLocaleString()
                                  : "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Fare Info */}
                      <div className="flex items-center">
                        <div className="text-right mr-6">
                          <h2 className="text-2xl font-bold text-black">
                            ₹ {totalFare.toLocaleString()}
                          </h2>
                          <p className="text-sm text-gray">per adult</p>
                          <p className="underline text-xs mt-1 text-yellow font-semibold">
                            Fare Details
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          <button
                            className="bg-yellow text-white font-semibold px-4 py-2 rounded-lg shadow"
                            onClick={() => {
                              handleOpenModal(selectedOnward, selectedReturn);
                            }}
                          >
                            BOOK NOW
                          </button>
                          <button className="bg-white text-blue font-semibold px-4 py-2 rounded-lg shadow">
                            LOCK PRICE
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showModal && (
                <FAREDETAILS
                  flightData={selectedFlight}
                  closeModal={handleCloseModal}
                />
              )}
            </div>
          </div>
        </div>
        {!isFilterOpen && !showModal && (
          <button
            className="mobile-filter-button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Image
              src="/icons/filter.png"
              className="w-6 h-6"
              width={16}
              height={16}
              alt="Flight img"
            />
          </button>
        )}
      </div>
    </DropdownProvider>
  );
}
