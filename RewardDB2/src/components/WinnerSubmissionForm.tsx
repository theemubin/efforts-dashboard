import React, { useState } from "react";
import { useUserProfile } from "../hooks/useUserProfile";

interface WinnerSubmissionFormProps {
  onClose?: () => void;
}
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import IconButton from '@mui/material/IconButton';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import Button from '@mui/material/Button';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import Slider from '@mui/material/Slider';
// Area type is exported directly from react-easy-crop
import type { Area } from 'react-easy-crop';

const getLastMonthYear = () => {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  const month = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();
  return { month, year };
};

const initialState = {
  name: "",
  house: "",
  campus: "",
  category: "",
  achievement: "",
  month: getLastMonthYear().month,
  year: getLastMonthYear().year,
  linkedin: "",
  github: "",
  profile: "",
  testimonialHeading: "",
  testimonial: "",
  image: null as File | null,
  crop: { x: 0, y: 0 },
  zoom: 1,
  croppedAreaPixels: null as Area | null
};

const CLOUDINARY_UPLOAD_PRESET = 'rewards_unsigned';
const CLOUDINARY_CLOUD_NAME = 'dyey1kwiz';

const uploadToCloudinary = async (file: File) => {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  const res = await axios.post(url, formData);
  return res.data.secure_url as string;
};

const WinnerSubmissionForm: React.FC<WinnerSubmissionFormProps> = ({ onClose }) => {
  const { profile } = useUserProfile();
  const [form, setForm] = useState(initialState);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Accept onClose prop for modal closing
  React.useEffect(() => {
    if (profile) {
      setForm(f => ({
        ...f,
        name: profile.displayName || "",
        house: profile.house || "",
        campus: profile.campus || ""
      }));
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDropdownChange = (e: any) => {
    const name = e.target.name;
    setForm({ ...form, [name]: e.target.value });
    // Auto-fill achievement for Overall/Culture/Academic
    if (name === "category") {
      let achievement = "";
      if (e.target.value === "Overall") achievement = "Overall Winner";
      if (e.target.value === "Culture") achievement = "Culture Winner";
      if (e.target.value === "Academic") achievement = "Academic Winner";
      setForm(f => ({ ...f, achievement, category: e.target.value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, image: file });
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // prevent double submits
    setSubmitting(true);
    let imageUrl = "";
    try {
      // Upload image to Cloudinary if present
      if (form.image) {
        imageUrl = await uploadToCloudinary(form.image);
      }
      // Save form data to Firestore
      await addDoc(collection(db, "winnerSubmissions"), {
        name: form.name,
        house: form.house,
        campus: form.campus,
        category: form.category,
        achievement: form.achievement,
        month: form.month,
        year: form.year,
        linkedin: form.linkedin,
        github: form.github,
        profile: form.profile,
        testimonialHeading: form.testimonialHeading,
        testimonial: form.testimonial,
        imageUrl,
        crop: croppedAreaPixels,
        zoom,
        status: "pending",
        createdAt: Timestamp.now()
      });
      setSubmitted(true);
      if (typeof onClose === 'function') onClose();
    } catch (err: any) {
      console.error('Submit testimonial failed:', err);
      const msg = err?.message || (typeof err === 'string' ? err : 'Unknown error');
      // show more helpful message to user
      alert(`Error submitting testimonial: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#00e6d2' }}>Thank you! Your testimonial is submitted for admin approval.</div>;
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Name, House, Campus - Prefilled, Readonly */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <TextField name="name" value={form.name} label="Name" fullWidth required InputProps={{ readOnly: true }} />
        <TextField name="house" value={form.house} label="House" fullWidth required InputProps={{ readOnly: true }} />
        <TextField name="campus" value={form.campus} label="Campus" fullWidth required InputProps={{ readOnly: true }} />
      </Box>
      {/* Category Dropdown */}
      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth required>
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            labelId="category-label"
            name="category"
            value={form.category}
            label="Category"
            onChange={handleDropdownChange}
            MenuProps={{ disablePortal: true }}
          >
            <MenuItem value="Academic">Academic</MenuItem>
            <MenuItem value="Culture">Culture</MenuItem>
            <MenuItem value="Overall">Overall</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {/* Achievement - auto-filled based on category */}
      <Box sx={{ mb: 2 }}>
        <TextField name="achievement" value={form.achievement} label="Achievement" fullWidth required InputProps={{ readOnly: true }} />
      </Box>
      {/* Month & Year Dropdowns */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <FormControl fullWidth required>
          <InputLabel id="month-label">Month</InputLabel>
          <Select
            labelId="month-label"
            name="month"
            value={form.month}
            label="Month"
            onChange={handleDropdownChange}
            MenuProps={{ disablePortal: true }}
          >
            {[
              "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
            ].map(m => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth required>
          <InputLabel id="year-label">Year</InputLabel>
          <Select
            labelId="year-label"
            name="year"
            value={form.year}
            label="Year"
            onChange={handleDropdownChange}
            MenuProps={{ disablePortal: true }}
          >
            {[2023, 2024, 2025].map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      {/* Social Links with logos */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <TextField name="linkedin" value={form.linkedin} onChange={handleChange} label="LinkedIn" fullWidth InputProps={{ startAdornment: <PhotoCamera /> }} />
        <TextField name="github" value={form.github} onChange={handleChange} label="GitHub" fullWidth InputProps={{ startAdornment: <PhotoCamera /> }} />
        <TextField name="profile" value={form.profile} onChange={handleChange} label="Profile Link" fullWidth InputProps={{ startAdornment: <PhotoCamera /> }} />
      </Box>
      {/* Testimonial Heading & Text */}
      <Box sx={{ mb: 2 }}>
        <TextField name="testimonialHeading" value={form.testimonialHeading} onChange={handleChange} label="Testimonial Heading" fullWidth required />
      </Box>
      <Box sx={{ mb: 2 }}>
        <TextField name="testimonial" value={form.testimonial} onChange={handleChange} label="Testimonial" fullWidth multiline rows={4} required />
      </Box>
      {/* Image Upload & Cropper */}
      <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 300 }}>
        <InputLabel shrink>Upload & Adjust Image</InputLabel>
        <IconButton color="primary" component="label" sx={{ mb: 1 }}>
          <input hidden accept="image/*" type="file" onChange={handleImageChange} />
          <PhotoCamera />
        </IconButton>
        {imagePreview && (
          <Box sx={{ position: 'relative', width: 250, height: 250, background: '#222', borderRadius: '1rem', overflow: 'hidden', mb: 2 }}>
            <Cropper
              image={imagePreview}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="round"
              showGrid={false}
            />
          </Box>
        )}
        {imagePreview && (
          <Box sx={{ width: 200, mt: 1 }}>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.01}
              onChange={(_, value) => setZoom(Number(value))}
              aria-label="Zoom"
            />
            <div style={{ textAlign: 'center', color: '#aaa', fontSize: '0.9rem' }}>Zoom</div>
          </Box>
        )}
      </Box>
  <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit'}</Button>
    </Box>
  );
};

export default WinnerSubmissionForm;
