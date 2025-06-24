"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { HamburgerMenuIcon, Cross2Icon } from "@radix-ui/react-icons";

import { FaChevronDown } from "react-icons/fa";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { usePathname, useRouter } from "next/navigation";
import {
  BusColorIcon,
  BusIcon,
  FlightColorIcon,
  FlightIcon,
  HolidayColorIcon,
  HolidayIcon,
  HotelColorIcon,
  HotelIcon,
  VisaColorIcon,
  VisaIcon,
} from "@/components/icon";
import { cn } from "@/lib/utils";
import LogoMain from "@/public/logoMain.png";
import { FiLogOut } from "react-icons/fi";

const navItems = [
  {
    title: "Flights",
    url: "/",
    icon: FlightIcon,
    activeIcon: FlightColorIcon,
    image: "/nav/plane.png",
    matchPaths: ["/", "/flight-search/page", "/flight/*"],
  },
  {
    title: "Hotels",
    url: "/hotel",
    icon: HotelIcon,
    activeIcon: HotelColorIcon,
    image: "/nav/hotel.png",
    matchPaths: ["/hotel", "/hotel-search", "/hotel/*"],
  },
  {
    title: "Buses",
    url: "/bus",
    icon: BusIcon,
    activeIcon: BusColorIcon,
    image: "/nav/bus.png",
    matchPaths: ["/bus", "/bus-search", "/bus/*"],
  },
  {
    title: "Holidays",
    url: "/holiday",
    icon: HolidayIcon,
    activeIcon: HolidayColorIcon,
    image: "/nav/holiday.png",
    matchPaths: ["/holiday"],
  },
  {
    title: "Visa",
    url: "/visa",
    icon: VisaIcon,
    activeIcon: VisaColorIcon,
    image: "/nav/visa.png",
    matchPaths: ["/visa"],
  },
];

const userString = localStorage.getItem("user");
const user = JSON.parse(userString);
console.log(user);

export default function Navbar({ isFixed, showTabsInNav }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTop, setIsTop] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const transparentNavPages = ["/", "/hotel", "/bus", "/holiday", "/visa", "/login"];

  const shouldHaveTransparentNav = transparentNavPages.includes(pathname);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Error parsing storedUser:", error);
          localStorage.removeItem("user");
        }
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const specificPaths = ["/", "/hotel", "/bus", "/holiday", "/visa"];
  const shouldShowTabsInNav = specificPaths.includes(pathname);

  useEffect(() => {
    const handleScroll = () => {
      setIsTop(window.scrollY === 0);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const ProfileMenu = () => (
    <Select>
      <SelectTrigger>
        <SelectValue
          placeholder={
            <span className="text-sm flex items-center gap-3">
              <span className="bg-blue-500 text-white font-semibold h-7 w-7 text-center rounded-full flex items-center justify-center">
                {user.email[0]}
              </span>
              <span className="font-semibold text-lg">Hi, {user.email}</span>
              <FaChevronDown className="text-gray-600" />
            </span>
          }
        />
      </SelectTrigger>
      <SelectContent className="bg-white p-4 shadow-lg rounded-md max-w-sm">
        <div>
          <p className="text-sm">You are viewing your personal profile</p>
          <Link href="/account">
            <div className="flex items-center p-2 rounded-lg mt-2 cursor-pointer">
              <span className="w-10 h-6 overflow-hidden">
                <Image
                  src="/icons/accountUser.png"
                  width={16}
                  height={16}
                  alt="Profile Icon"
                />
              </span>
              <h3 className="font-semibold text-sm">My Profile</h3>
            </div>
          </Link>
          <Link href="/Bookings">
            <div className="flex items-center p-2 rounded-lg">
              <span className="w-10 h-6 overflow-hidden">
                <Image
                  src="/icons/accountTrip.png"
                  width={16}
                  height={16}
                  alt="Trips Icon"
                />
              </span>
              <h3 className="font-semibold text-sm">My Trips</h3>
            </div>
          </Link>
          <Link href="/wallet">
            <div className="flex items-center p-2 rounded-lg">
              <span className="w-10 h-6 overflow-hidden">
                <Image
                  src="/icons/accountWallet.png"
                  width={16}
                  height={16}
                  alt="Wallet Icon"
                />
              </span>
              <h3 className="font-semibold text-sm">My Wallet</h3>
            </div>
          </Link>
          <button
            className="rounded-md bg-red-500 text-white p-2 mt-2"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </SelectContent>
    </Select>
  );

  return (
    <nav
      className={`w-full md:fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-2 ${
        isFixed
          ? "glass shadow-md animate-slide-down z-40 bg-white"
          : shouldHaveTransparentNav && !isFixed
          ? "bg-transparent backdrop-blur-none"
          : "relative bg-white"
      }`}
    >
      <div className="md:container flex justify-between items-center py-4 ">
        <Link href={"/"}>
          <Image
            src={LogoMain}
            width={160}
            height={160}
            alt="Company Logo"
            className="w-24 md:w-40"
            priority
          />{" "}
        </Link>

        {!isTop && (
          <div className="hidden md:flex items-center">
            <div
              className={cn(
                "flex space-x-1",
                shouldShowTabsInNav
                  ? showTabsInNav
                    ? "opacity-100 translate-y-0 visible transition-all duration-300"
                    : "opacity-0 -translate-y-6  h-0 transition-all duration-300"
                  : "opacity-100 translate-y-0 visible transition-all duration-300"
              )}
            >
              {navItems.map((item) => {
                const isActive = item.matchPaths.some((path) => {
                  if (path.endsWith("/*")) {
                    return pathname.startsWith(path.replace("/*", ""));
                  }
                  return pathname === path;
                });
                const Icon = isActive ? item.activeIcon : item.icon;
                return (
                  <Link href={item.url} key={item.title}>
                    <button
                      className={`flex items-center px-3 rounded-lg gap-1 text-xs md:text-sm transition-all duration-200 relative`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          isActive ? "text-black" : "text-gray"
                        }`}
                      />
                      <span
                        className={`${
                          isActive ? "text-black font-semibold" : "text-gray"
                        }`}
                      >
                        {item.title}
                      </span>

                      {isActive && (
                        <span className="absolute -bottom-2 left-0 right-0 h-1 bg-yellow rounded-full w-full"></span>
                      )}
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
        <div className="hidden md:flex space-x-4 items-center">
          {user ? (
            <div className="flex items-center space-x-4">
              <Select open={isProfileMenuOpen} onOpenChange={setIsProfileMenuOpen}>
                <SelectTrigger className="">
                  <SelectValue
                    placeholder={
                      <span className="text-sm text-gray-700 flex items-center gap-3">
                        <span className="gap-1 flex items-center">
                          <span 
                          style={{
                            background: 'radial-gradient(circle,#2E8299)',
                            color:'white'
                          }}
                          className="h-7 w-7 text-center rounded-full flex items-center justify-center">
                            {user.email[0]}
                          </span>
                          <span className="font-semibold text-lg">
                            Hi, {user.email}
                          </span>
                        </span>
                        <span>
                          <FaChevronDown className="inline mr-2 text-gray-600" />
                        </span>
                      </span>
                    }
                  />
                </SelectTrigger>
                <SelectContent  className="bg-white p-3 shadow-lg rounded-lg max-w-xs md:max-w-sm border border-gray-200">
  <div className="space-y-3">
    <p className="text-gray-600 text-sm">
      Welcome to your personal profile. Navigate your account below.
    </p>

    <Link href="/account" onClick={() => setIsProfileMenuOpen(false)}>
      <div className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-0 active:bg-gray-100 transition-colors duration-200">
        <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-blue-100 rounded-full">
          <Image
            src="/icons/accountUser.png"
            alt="Profile Icon"
            width={20}
            height={20}
            className="w-4 h-4 md:w-5 md:h-5"
          />
        </div>
        <span className="ml-3 text-gray-800 font-medium md:font-semibold text-sm md:text-base">My Profile</span>
      </div>
    </Link>

    <Link href="/trips" onClick={() => setIsProfileMenuOpen(false)}>
      <div className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200">
        <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-green-100 rounded-full">
          <Image
            src="/icons/accountTrip.png"
            alt="Trips Icon"
            width={20}
            height={20}
            className="w-4 h-4 md:w-5 md:h-5"
          />
        </div>
        <span className="ml-3 text-gray-800 font-medium md:font-semibold text-sm md:text-base">My Trips</span>
      </div>
    </Link>

    <Link href="/wallet" onClick={() => setIsProfileMenuOpen(false)}>
      <div className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200">
        <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-yellow-100 rounded-full">
          <Image
            src="/icons/accountWallet.png"
            alt="Wallet Icon"
            width={20}
            height={20}
            className="w-4 h-4 md:w-5 md:h-5"
          />
        </div>
        <div className="ml-3">
          <span className="text-gray-800 font-medium md:font-semibold block text-sm md:text-base">My Wallet</span>
          <span className="bg-green-400 px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-lg text-xs md:text-sm font-semibold text-white">
            ₹ 0
          </span>
        </div>
      </div>
    </Link>

    <button
      className="flex items-center justify-center gap-2 w-full p-2 md:p-3 rounded-lg bg-red-500 text-white font-medium md:font-semibold hover:bg-red-600 active:bg-red-700 transition-colors duration-200 text-sm md:text-base"
      onClick={handleLogout}
    >
      <FiLogOut className="w-4 h-4 md:w-5 md:h-5" />
      Logout
    </button>
  </div>
</SelectContent>

              </Select>
            </div>
          ) : (
            <Link href="/login">
              <button className="bg-gradient-to-r from-[#046994] via-[#57c785] to-[#046994] bg-clip-text text-transparent font-semibold p-2">
                Login | Signup
              </button>
            </Link>
          )}
        </div>

        <button className="md:hidden" onClick={toggleDrawer}>
          {!isDrawerOpen ? <HamburgerMenuIcon className="w-6 h-6" /> : null}
        </button>
      </div>

      {isDrawerOpen && (
        <div className="fixed top-0 right-0 w-4/5 bg-white shadow-lg z-50 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button onClick={toggleDrawer}>
              <Cross2Icon className="w-6 h-6" />
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {user ? (
              <>
                <ProfileMenu />
                <button
                  className="rounded-md bg-red-500 text-white p-2"
                  onClick={() => {
                    handleLogout();
                    toggleDrawer();
                  }}
                >
                  Logout  
                </button>
              </>
            ) : (
              <Link href="/login">
                <button
                  className="w-full rounded-md bg-yellow text-white p-2"
                  onClick={toggleDrawer}
                >
                  Login or Signup
                </button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
