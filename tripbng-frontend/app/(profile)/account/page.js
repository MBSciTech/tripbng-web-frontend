"use client";
import { Container, Input } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { profileLinks } from "@/constants/data/profile";
import { apiService } from "@/lib/api";
import { Phone } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useRef, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import toast from "react-hot-toast";
import { FaChevronDown, FaChevronUp, FaEye, FaEyeSlash } from "react-icons/fa";
//import user_details_transfare from '../../../components/user_details_transfare'

export default function Page() {
  const router = useRouter();
  // Create references for each section
  const profileRef = useRef(null);
  const loginDetailsRef = useRef(null);
  const coTravellersRef = useRef(null);
  const loggedInDevicesRef = useRef(null);
  const logoutRef = useRef(null);

  // State to track the active link
  const [activeLink, setActiveLink] = useState("Profile");
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenEdit, setIsModalOpenEdit] = useState(false);
  const [isModalOpenPassword, setIsModalOpenPassword] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State initialization
  const [userInfo, setUserInfo] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState("");
  const [deleteMobile, setDeleteMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [isModalOpenOtp, setIsModalOpenOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const correctOtp = "1234";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
    }
  }, []);

  const handleDeleteClick = () => {
    setIsModalOpenOtp(true);
  };

  const handleNameChange = (e) => setName(e.target.value);

  const handleAddressChange = (e) => setAddress(e.target.value);
  const handlePincodeChange = (e) => setPincode(e.target.value);
  const handleStateChange = (e) => setState(e.target.value);
  const handleEmail = (e) => setEmail(e.target.value);

  const handleTotal = () => {
    const count = userInfo?.name + userInfo?.email;
  };

  const handleDateChange = (date) => {
    const formattedDate = date ? date.toISOString().split("T")[0] : "";
    setBirthday(formattedDate); // Store the selected date in the state
  };

  // Handle gender selection
  const handleGenderChange = (value) => {
    setGender(value);
  };

  // Handle marital status selection
  const handleMaritalStatusChange = (value) => {
    setMaritalStatus(value);
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };
  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible((prev) => !prev);
  };
  const toggleSection = () => {
    setIsOpen(!isOpen);
  };
  // Function to handle scrolling within the right-side content container
  const handleScrollToSection = (sectionRef, sectionName) => {
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setActiveLink(sectionName);
    }
  };

  // Scroll to "Profile" by default on mount
  useEffect(() => {
    handleScrollToSection(profileRef, "Profile");
  }, []);

  // Function to open the modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Function to open the modal
  const openModalEdit = () => {
    setIsModalOpenEdit(true);
  };

  // Function to close the modal
  const closeModalEdit = () => {
    setIsModalOpenEdit(false);
  };
  // Function to open the modal
  const openModalPassword = () => {
    setIsModalOpenPassword(true);
  };

  // Function to close the modal
  const closeModalPassword = () => {
    setIsModalOpenPassword(false);
  };

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      try {
        const response = await apiService.get("/user/profile");
        if (response.success) {
          const parsedUser = response.data;
          localStorage.setItem("user", JSON.stringify(parsedUser));
          setUserInfo(parsedUser);
          setPhone(parsedUser?.mobile || "");
          setName(parsedUser?.name || "");
          setEmail(parsedUser?.email || "");
          setBirthday(parsedUser?.DOB || "");
          setGender(parsedUser?.gender || "");
          setMaritalStatus(parsedUser?.maritalStatus || "");
          setAddress(parsedUser?.address || "");
          setPincode(parsedUser?.pincode || "");
          setState(parsedUser?.state || "");
          console.log("hello", response);
          

        }
      } catch (error) {
        toast.error(error.message);
        console.log(error);
      }
    }
  };

  const updateProfile = async () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    // Check if the name is empty
    if (!name.trim()) {
      toast.error("Full Name is required");
      return;
    }
    if (token && user) {
      try {
        const response = await apiService.patch("/user/profile", {
          name: name || null,
          DOB: birthday,
          gender: gender,
          maritalStatus: maritalStatus,
          address: address,
          state: state,
          pincode: pincode,
          email: email,
        });
        if (response.success) {
          getProfile();
          toast.success("Profile Updated Successful!");
          closeModalEdit();
          closeModal();
        }
      } catch (error) {
        toast.error(error.message);
        console.log(error);
      }
    }
  };

  const sendDeleteOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiService.post("/user/deleteaccountotpsend", {
        mobile: phone,
      });

      if (response.status == 200) {
        setIsModalOpenOtp(true);
      } else {
        setError(response.data.message || "Failed to send OTP.");
      }
    } catch (error) {
      setError("Error sending OTP. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Function to verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("OTP must be 6 digits.");
      return;
    }
  
    setOtpLoading(true);
    setError("");
  
    try {
      const response = await apiService.post("/user/verifyotpfordelete", { otp });
  
      if (response.status === 200) {
        alert("Account deleted successfully.");
  
        // Clear user session
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setIsModalOpenOtp(false);
  
        toast.success("Account deleted successfully.");
  
        // Navigate to home
        router.push("/");
        setTimeout(() => {
          window.location.href = "/"; // Fallback if router.push doesn't work
        }, 200);
      } else {
        setError(response.data.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      setError(error.response?.data?.message || "OTP verification failed.");
      console.error(error);
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="bg-transparent mt-28 mb-12 2xl:max-w-[1450px] mx-auto ">
      {/* Content goes here */}

      {/* <div className="hidden md:block w-64 items-center bg-white shadow-lg rounded-lg p-3 overflow-y-auto fixed">
          <span
            className="relative rounded-full w-3/5 h-36 flex flex-col items-center justify-center text-white text-4xl font-semibold mx-auto"
            style={{
              background:
                "linear-gradient(to right, #339c8d, #83c961, #9fd94e)",
            }}
          >
            H
            <button className="absolute bottom-5 -right-4 border-4 border-white bg-gray-500 rounded-full p-2">
              <img src="icons/edit.png" className="h-4 w-4" />
            </button>
          </span>

          <div className="flex flex-col items-center mt-2">
            <h1 className="text-xl font-semibold">{userInfo?.name}</h1>
            <p className="text-sm font-medium text-gray-500">
              PERSONAL PROFILE
            </p>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {profileLinks.map((item, index) => (
              <span
                key={index}
                className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg ${
                  activeLink === item.text
                    ? "bg-yellow/20 text-yellow font-medium"
                    : "hover:bg-gray-100"
                }`}
                onClick={() =>
                  handleScrollToSection(
                    item.text === "Profile"
                      ? profileRef
                      : item.text === "Login Details"
                      ? loginDetailsRef
                      : item.text === "Co-Travellers"
                      ? coTravellersRef
                      : item.text === "Logged In Devices"
                      ? loggedInDevicesRef
                      : logoutRef,
                    item.text
                  )
                }
              >
                <img src={item.image} className="w-6 h-6" />
                <p>{item.text}</p>
              </span>
            ))}
          </div>
        </div> */}

      <div className="flex-1 p-3 h-full w-full">
        <div className="mb-5">
          <div className="bg-white rounded-lg border p-3 mb-5">
            <div className="flex items-center gap-10">
              <span
                className="relative rounded-full w-20 h-20 md:w-36 md:h-36 p-1 flex flex-col items-center justify-center text-white text-2xl md:text-4xl font-semibold "
                style={{
                  background:
                    "linear-gradient(to right, #339c8d, #83c961, #9fd94e)",
                }}
              >
                {userInfo?.email[0]}
                <button className="absolute bottom-2 md:bottom-5 -right-4 border-2 md:border-4 border-white bg-gray-500 rounded-full p-2">
                  <Image
                    src="/icons/edit.png"
                    width={100}
                    height={100}
                    className="h-3 w-3 md:h-4 md:w-4"
                    alt="profile img"
                  />
                </button>
              </span>

              <div className="flex flex-col items-start mt-2">
                <h1 className="text-xl font-semibold">{userInfo?.name}</h1>
                <p className="text-sm font-medium text-gray-500">
                  {userInfo?.mobile}
                </p>
                <p className="text-sm font-medium text-gray-500">
                  {userInfo?.email}
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-3 px-3 mt-6 md:mx-5 bg-gray-100 rounded-lg">
              {userInfo?.email ? (
                <span className="flex items-center gap-3">
                  <Image
                    className="w-4 h-4 md:h-6 md:w-6"
                    src="/icons/accept.png"
                    width={100}
                    height={100}
                    alt="profile img"
                  />
                  <p className="text-yellow font-semibold text-sm">
                    Verified Email Address
                  </p>
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <Image
                    className="w-4 h-4 md:h-6 md:w-6"
                    src="/icons/plus.png"
                    width={100}
                    height={100}
                    alt="profile img"
                  />
                  <button
                    className="font-medium text-sm"
                    onClick={() => openModal()}
                  >
                    Add your Email
                  </button>
                </span>
              )}

              <span className="flex items-center gap-3">
                <Image
                  className="w-4 h-4 md:h-6 md:w-6"
                  src="/icons/accept.png"
                  width={100}
                  height={100}
                  alt="profile img"
                />
                <p className="text-yellow font-semibold text-sm">
                  Verified mobile Number
                </p>
              </span>
              {userInfo?.name ||
              userInfo?.gender ||
              userInfo?.maritalStatus ||
              userInfo?.birthday ? (
                <span className="flex items-center gap-3">
                  <Image
                    className="w-4 h-4 md:h-6 md:w-6"
                    src="/icons/accept.png"
                    width={100}
                    height={100}
                    alt="profile img"
                  />
                  <p className="text-yellow font-semibold text-sm">
                    Complete Basic Info
                  </p>
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <Image
                    className="w-8 h-8"
                    src="/icons/plus.png"
                    width={100}
                    height={100}
                    alt="profile img"
                  />
                  <button
                    className="text-sm font-medium "
                    onClick={() => openModalEdit()}
                  >
                    Complete Basic Info
                  </button>
                </span>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg border py-3">
            <div className="flex items-center justify-between mr-3">
              <span className="border-l-4 border-gray-500">
                <div className="ml-2">
                  <h1 className="text-xl font-semibold md:text-3xl">Profile</h1>
                  <p className="text-sm md:text-lg font-medium text-gray-500">
                    Basic info, for a faster booking experience
                  </p>
                </div>
              </span>
              <button
                className="flex items-center gap-2 border rounded-lg p-2"
                onClick={() => {
                  openModalEdit();
                }}
              >
                <Image
                  src="/icons/editYellow.png"
                  width={100}
                  height={100}
                  className="w-4 h-4 sm:w-4 sm:h-4 md:w-6 md:h-6"
                  alt="profile img"
                />
                <p className="font-medium md:text:lg text-sm">EDIT</p>
              </button>
            </div>
            <div className="mt-8 p-3">
              <div className="">
                <span className="flex items-center justify-between md:w-2/5">
                  <p className="text-sm">NAME</p>
                  <p className="font-medium md:text-start md:w-1/2">
                    {userInfo?.name}
                  </p>
                </span>
              </div>
              <div className="border-b mt-2 mb-3"></div>
              <div className="">
                <span className="flex items-center justify-between md:w-2/5">
                  <p className="text-sm">BIRTHDAY</p>
                  {birthday ? (
                    <p className="font-medium md:text-start md:w-1/2">
                      {new Date(userInfo.DOB).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  ) : (
                    <button
                      className="font-medium text-yellow"
                      onClick={() => openModalEdit()}
                    >
                      + Add
                    </button>
                  )}
                </span>
              </div>
              <div className="border-b mt-2 mb-3"></div>

              <div className="">
                <span className="flex items-center justify-between md:w-2/5">
                  <p className="text-sm">GENDER</p>
                  {userInfo?.gender ? (
                    <p className="font-medium md:text-start md:w-1/2">
                      {userInfo?.gender}
                    </p>
                  ) : (
                    <button
                      className="font-medium text-yellow"
                      onClick={() => openModalEdit()}
                    >
                      + Add
                    </button>
                  )}
                </span>
              </div>
              <div className="border-b mt-2 mb-3"></div>
              <div className="">
                <span className="flex items-center justify-between md:w-2/5">
                  <p className="text-sm">MARITAL STATUS</p>
                  {userInfo?.maritalStatus ? (
                    <p className="font-medium md:text-start md:w-1/2">
                      {userInfo?.maritalStatus}
                    </p>
                  ) : (
                    <button
                      className="font-medium text-yellow"
                      onClick={() => openModalEdit()}
                    >
                      + Add
                    </button>
                  )}
                </span>
              </div>
              <div className="border-b mt-2 mb-3"></div>
              <div className="">
                <span className="flex items-center justify-between md:w-2/5">
                  <p className="text-sm">YOUR ADDRESS</p>
                  {address ? (
                    <p className="font-medium md:text-start text-end w-1/2">
                      {address}
                    </p>
                  ) : (
                    <button
                      className="font-medium text-yellow"
                      onClick={() => openModalEdit()}
                    >
                      + Add
                    </button>
                  )}
                </span>
              </div>
              <div className="border-b mt-2 mb-3"></div>
              <div className="">
                <span className="flex items-center justify-between md:w-2/5">
                  <p className="text-sm">PINCODE</p>
                  {pincode ? (
                    <p className="font-medium md:text-start md:w-1/2">
                      {userInfo.pincode}
                    </p>
                  ) : (
                    <button
                      className="font-medium text-yellow"
                      onClick={() => openModalEdit()}
                    >
                      + Add
                    </button>
                  )}
                </span>
              </div>
              <div className="border-b mt-2 mb-3"></div>
              <div className="">
                <span className="flex items-center justify-between md:w-2/5">
                  <p className="text-sm">STATE</p>
                  {state ? (
                    <p className="font-medium md:text-start md:w-1/2">
                      {state}
                    </p>
                  ) : (
                    <button
                      className="font-medium text-yellow"
                      onClick={() => openModalEdit()}
                    >
                      + Add
                    </button>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-5">
          <div className="bg-white rounded-lg border py-3">
            <div className="flex items-center justify-between mr-3">
              <span className="border-l-4 border-gray-500">
                <div className="ml-2">
                  <h1 className="text-xl font-semibold md:text-3xl">
                    Login Details
                  </h1>
                  <p className="text-sm md:text-lg font-medium text-gray-500">
                    Manage your mobile number, email address and password
                  </p>
                </div>
              </span>
            </div>
            <div className="mt-8 p-3">
              <div className="">
                <span className="flex items-center justify-between md:w-2/5">
                  <p className="text-sm">MOBILE NUMBER</p>

                  <span className="flex items-center justify-start gap-2 md:w-1/2">
                    <p className="font-medium  text-start">{phone}</p>
                    <Image
                      src="/icons/accept.png"
                      width={100}
                      height={100}
                      className="w-4 h-4 md:h-6 md:w-6"
                      alt="profile img"
                    />
                    <p className="font-medium text-sm text-green-5  00">
                      Verified
                    </p>
                  </span>
                </span>
              </div>
              <div className="border-b mt-2 mb-3"></div>
              <div className="">
                <span className="flex items-center justify-between md:w-2/5">
                  <p className="text-sm">EMAIL ID</p>
                  {email ? (
                    <span className="flex items-center justify-start gap-2 md:w-1/2">
                      <p className="font-medium text-start">{email}</p>
                      <Image
                        src="/icons/accept.png"
                        width={100}
                        height={100}
                        className="w-6 h-6"
                        alt="profile img"
                      />
                      <p className="font-medium text-sm text-green-5  00">
                        Verified
                      </p>
                    </span>
                  ) : (
                    <button
                      className="font-medium text-yellow w-1/2 text-start"
                      onClick={() => openModal()}
                    >
                      + Add your Email ID
                    </button>
                  )}
                </span>
              </div>
              <div className="border-b mt-2 mb-3"></div>

              <div className="">
                <span className="flex items-center justify-between">
                  <div className="flex items-center justify-between w-2/5">
                    <p className="text-sm">PASSWORD</p>
                    <button className="font-medium text-black  text-start">
                      *******
                    </button>
                  </div>
                  <button
                    className="text-yellow font-medium text-sm"
                    onClick={() => {
                      openModalPassword();
                    }}
                  >
                    Change Password?
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-5">
          <div className="bg-white rounded-lg border py-3">
            <div className="flex items-center justify-between mr-3">
              <span className="border-l-4 border-gray-500">
                <div className="ml-2">
                  <h1 className="text-xl font-semibold md:text-3xl">
                    Co-Travellers
                  </h1>
                  <p className="text-sm md:text-lg font-medium text-gray-500">
                    Add, Remove and Update your traveller list
                  </p>
                </div>
              </span>
              <button className="flex items-center gap-2 border rounded-lg p-2">
                <Image
                  src="/icons/editYellow.png"
                  width={100}
                  height={100}
                  className="w-4 h-4 sm:w-4 sm:h-4 md:w-6 md:h-6"
                  alt="profile img"
                />
                <p className="font-medium md:text:lg text-sm">ADD TRAVELLER</p>
              </button>
            </div>
            <div className="flex items-center justify-between mx-3 mt-3 group">
              <div className="flex items-center gap-3">
                <span className="bg-green-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-semibold">
                  HP
                </span>
                <span>
                  <p className="font-semibold">hp patel</p>
                  <p>Male, 22y, 12/22/2002</p>
                </span>
              </div>
              <button className="text-yellow font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                View Detail
              </button>
            </div>
          </div>
        </div>
        <div className="mb-5">
          <div className="bg-white rounded-lg border py-3">
            <div className="flex items-center justify-between mr-3">
              <span className="border-l-4 border-gray-500">
                <div className="ml-2">
                  <h1 className="text-xl font-semibold md:text-3xl">
                    Logged In Devices
                  </h1>
                  <p className="text-sm md:text-lg font-medium text-gray-500">
                    Check all the devices where your account is logged in
                  </p>
                </div>
              </span>
              <button
                className="flex items-center gap-2 rounded-lg p-2"
                onClick={toggleSection}
              >
                {isOpen ? (
                  <FaChevronUp className="inline mr-2 text-yellow" />
                ) : (
                  <FaChevronDown className="inline mr-2 text-yellow" />
                )}
              </button>
            </div>
            {isOpen && (
              <div className="mx-3 mt-5">
                <span className="flex gap-3">
                  <Image
                    src="icons/monitor.png"
                    className="w-10 h-10"
                    alt="profile img"
                  />
                  <span>
                    <p className="font-semibold ">
                      Chrome <span>(Current device)</span>
                    </p>
                    <p>Desktop Web</p>
                    <p>MANESAR, IN</p>
                    <p>Logged In since 10:13 am, 30th Dec {"'"}24</p>
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="mb-5">
          <div className="bg-white rounded-lg border py-3">
            <div className="flex items-center justify-between mr-3">
              <span className="border-l-4 border-red-500">
                <div className="ml-2">
                  <h1 className="text-xl font-semibold md:text-3xl text-red-600">
                    Delete Account
                  </h1>
                  <p className="text-sm md:text-lg font-medium text-gray-500">
                    Deleting your account will permanently remove all your data.
                  </p>
                </div>
              </span>
            </div>
            <div className="mx-3 mt-5">
              <p className="text-sm text-gray-600">
                This action is irreversible. All your data will be lost, and you
                won't be able to recover it.
              </p>
              <button
                className="bg-red-600 text-white font-semibold px-4 py-2 rounded-lg mt-4 hover:bg-red-700 disabled:bg-gray-400"
                onClick={sendDeleteOtp}
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Delete My Account"}
              </button>
            </div>
          </div>

          {isModalOpenOtp && (
            <div
              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
              onClick={() => setIsModalOpenOtp(false)}
            >
              <div
                className="bg-white p-6 rounded-lg shadow-lg w-96"
                onClick={(e) => e.stopPropagation()} // Prevent modal close when clicking inside
              >
                <h2 className="text-xl font-semibold text-gray-800">
                  Enter OTP
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Enter the 6-digit OTP sent to your email/phone.
                </p>
                <input
                  type="text"
                  maxLength="6"
                  className="w-full border p-2 rounded-lg text-center text-xl"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <div className="flex justify-between mt-4">
                  <button
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                    onClick={() => setIsModalOpenOtp(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading}
                  >
                    {otpLoading ? "Verifying..." : "Verify OTP"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/30"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl w-11/12 sm:w-1/1 lg:w-2/5 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h1 className="font-semibold text-3xl">Add your Email ID</h1>
              <p>
                For a faster booking experience, exclusive offers and rewards
              </p>
            </div>

            <div className="mt-5">
              <p className="font-medium">Email ID</p>
              <Input
                placeholder="eg.johndoe@gmai.com"
                value={email}
                onChange={handleEmail}
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                className="text-yellow font-medium"
                onClick={() => {
                  closeModal();
                }}
              >
                Cancel
              </button>

              <button
                className={`py-1 px-4 rounded-lg text-white font-medium ${
                  email ? "bg-yellow" : "bg-gray-400 cursor-not-allowed"
                }`}
                onClick={() => {
                  updateProfile();
                }}
                disabled={!email}
              >
                SUBMIT
              </button>
            </div>
          </div>
        </div>
      )}
      {isModalOpenEdit && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/30"
          onClick={closeModalEdit}
        >
          <div
            className="bg-white rounded-xl w-11/12 sm:w-1/1 lg:w-2/5 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h1 className="font-semibold text-3xl">Edit Profile</h1>
            </div>

            <div className="flex flex-col sm:grid sm:grid-cols-2 sm:gap-4">
              {/* Full Name */}
              <div className="mt-2">
                <p className="font-medium">
                  Full Name <span className="text-red-500">*</span>
                </p>
                <Input
                  placeholder="Enter Name"
                  value={name}
                  onChange={handleNameChange}
                  className={name.trim() === "" ? "border-red-500" : ""}
                />
                {name.trim() === "" && (
                  <p className="text-red-500 text-sm mt-1">
                    Full Name is required
                  </p>
                )}
              </div>

              {/* Birthday */}
              <div className="mt-2">
                <p className="font-medium">Birthday</p>
                <DatePicker
                  selected={birthday ? new Date(birthday) : null}
                  onChange={handleDateChange}
                  dateFormat="yyyy-MM-dd"
                  className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow disabled:cursor-not-allowed disabled:opacity-50"
                  placeholderText={birthday || "Select birthday"}
                  showYearDropdown
                  scrollableMonthYearDropdown
                />
              </div>

              {/* Gender */}
              <div className="mt-2">
                <p className="font-medium">Gender</p>
                <Select
                  className="w-full p-2 border rounded-lg"
                  value={gender}
                  onValueChange={handleGenderChange}
                  onChange={(e) => handleGenderChange(e.target.value)}
                >
                  <SelectTrigger className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 shadow-sm text-gray-500 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow disabled:cursor-not-allowed disabled:opacity-50">
                    <SelectValue
                      placeholder={userInfo?.gender || "Select Gender"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Marital Status */}
              <div className="mt-2">
                <p className="font-medium">Marital Status</p>
                <Select
                  className="w-full p-2 border rounded-lg"
                  value={maritalStatus}
                  onValueChange={handleMaritalStatusChange}
                  onChange={(e) => handleMaritalStatusChange(e.target.value)}
                >
                  <SelectTrigger className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 shadow-sm text-gray-500 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow disabled:cursor-not-allowed disabled:opacity-50">
                    <SelectValue
                      placeholder={
                        userInfo?.maritalStatus || "Select Marital Status"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Unmarried">Unmarried</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Address */}
              <div className="mt-2">
                <p className="font-medium">Your Address</p>
                <Input
                  placeholder="Enter address"
                  value={address}
                  onChange={handleAddressChange}
                />
              </div>

              {/* Pincode */}
              <div className="mt-2">
                <p className="font-medium">Pincode</p>
                <Input
                  placeholder="Enter pincode"
                  value={pincode}
                  onChange={handlePincodeChange}
                />
              </div>

              {/* State */}
              <div className="mt-2">
                <p className="font-medium">State</p>
                <Input
                  placeholder="Enter state"
                  value={state}
                  onChange={handleStateChange}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                className="text-yellow font-medium"
                onClick={closeModalEdit}
              >
                Cancel
              </button>

              <button
                className="bg-yellow py-1 px-4 rounded-lg text-white font-medium"
                onClick={updateProfile}
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}
      {isModalOpenPassword && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/30"
          onClick={closeModalPassword}
        >
          <div
            className="bg-white rounded-xl w-11/12 sm:w-1/1 lg:w-2/5 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h1 className="font-semibold text-3xl">Change Password?</h1>
            </div>

            <div className="mt-5">
              <p className="font-medium">Old Password</p>
              <Input placeholder="Enter old password" />
            </div>
            <div className="mt-2">
              <p className="font-medium">New Password</p>
              <div className="relative">
                <Input
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {passwordVisible ? <FaEye /> : <FaEyeSlash />}
                </button>
              </div>
            </div>
            <div className="mt-2">
              <p className="font-medium">Confirm New Password</p>
              <div className="relative">
                <Input
                  type={confirmPasswordVisible ? "text" : "password"}
                  placeholder="Enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {confirmPasswordVisible ? <FaEye /> : <FaEyeSlash />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                className="text-yellow font-medium"
                onClick={() => {
                  closeModal();
                }}
              >
                Cancel
              </button>

              <button className="bg-yellow py-1 px-4 rounded-lg text-white font-medium">
                SUBMIT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
