"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TextField, Button, CircularProgress } from "@mui/material";

import ShowAlerts from "./alerts/ShowAlerts";

export default function Page() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    carModel: "",
    price: "",
    phoneNumber: "",
    city: "",
  });
  const [userId, setUserId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");  
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");  
  const [maxImages, setMaxImages] = useState(10); 

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/login");
    } else {
      const parsedUser = JSON.parse(user);
      setUserId(parsedUser.data._id);
    }
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleMaxImagesChange = (e) => {
    const value = Math.min(e.target.value, 10); 
  

    setMaxImages(value);
    if (selectedFiles.length > value) {
      const excessFiles = selectedFiles.length - value;
      setSelectedFiles((prevFiles) => prevFiles.slice(0, value));
      setImagePreviews((prevPreviews) => prevPreviews.slice(0, value));
      alert(`You can only upload a maximum of ${value} images. ${excessFiles} image(s) were removed.`);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    if (selectedFiles.length + files.length > maxImages) {
      alert(`You can only upload a maximum of ${maxImages} images.`);
      return;
    }

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const handleDeleteImage = (index) => {
    setImagePreviews((prevPreviews) =>
      prevPreviews.filter((_, i) => i !== index)
    );
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.carModel.length < 3) {
      newErrors.carModel = "Car model must be at least 3 characters long";
    }

    if (!formData.price || isNaN(formData.price)) {
      newErrors.price = "Price must be a valid number";
    }

    if (!formData.phoneNumber.match(/^\d{11}$/)) {
      newErrors.phoneNumber = "Phone number must be exactly 11 digits";
    }

    if (!formData.city) {
      newErrors.city = "City is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImages = async () => {
    const uploadPromises = selectedFiles.map(async (file) => {
      const fileData = new FormData();
      fileData.append("file", file);
      fileData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      );
      fileData.append(
        "cloud_name",
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      );

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dsac1d8rz/image/upload",
        {
          method: "POST",
          body: fileData,
        }
      );

      const data = await response.json();
      return data.secure_url;
    });

    return await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);
      setApiError("");  // Reset API error message on each submit
      setSuccessMessage("");  // Reset success message

      try {
        const imageUrls = await uploadImages();

        const formDataToSend = {
          ...formData,
          images: imageUrls,
          userId: userId,
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_DATABASE_CONNECT}/api/vehicles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formDataToSend),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to submit the form");
        }

        // Success message
        setSuccessMessage("Vehicle information submitted successfully");

        // Clear form and image previews
        setFormData({
          carModel: "",
          price: "",
          phoneNumber: "",
          city: "",
        });
        setSelectedFiles([]);
        setImagePreviews([]);
        setErrors({});
      } catch (error) {
        setApiError(error.message);  // Display API error message
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Add Vehicle Information</h1>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>

      {successMessage && <ShowAlerts type="success" message={successMessage} />}
      {apiError && <ShowAlerts type="error" message={apiError} />}

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <div>
          <TextField
            label="Car Model"
            variant="outlined"
            fullWidth
            name="carModel"
            value={formData.carModel}
            onChange={handleInputChange}
            error={!!errors.carModel}
            helperText={errors.carModel}
          />
        </div>

        <div>
          <TextField
            label="Price"
            variant="outlined"
            fullWidth
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            error={!!errors.price}
            helperText={errors.price}
            type="number"
          />
        </div>

        <div>
          <TextField
            label="Phone Number"
            variant="outlined"
            fullWidth
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            error={!!errors.phoneNumber}
            helperText={errors.phoneNumber}
            type="tel"
          />
        </div>

        <div>
          <TextField
            label="City"
            variant="outlined"
            fullWidth
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            error={!!errors.city}
            helperText={errors.city}
          />
        </div>

        <div>
          <TextField
            label="Max Number of Images"
            variant="outlined"
            fullWidth
            type="number"
            value={maxImages}
            onChange={handleMaxImagesChange}
            inputProps={{ min: 1, max: 10 }}
          />
        </div>

        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="mt-2 block w-full text-sm text-gray-700 border-gray-300 shadow-sm rounded-md"
          />
        </div>

        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative h-40">
                <img
                  src={preview}
                  alt={`Selected image ${index + 1}`}
                  className="object-cover rounded-lg w-full h-full"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-2"
                  style={{ paddingLeft: "13px", paddingRight: "13px" }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ py: 2 }}
          disabled={imagePreviews.length===0}
        >
          Submit
        </Button>
      </form>
    </div>
  );
}
