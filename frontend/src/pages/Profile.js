import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile } from '../services/userService';
import { setAuthToken } from '../services/authService';

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ username: '', email: '', role: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      fetchProfile();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      setProfile(response.data);
    } catch (error) {
      alert('Failed to load profile');
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile(profile);
      setIsEditing(false);
      alert('Profile updated');
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  return (
    <div className="container mt-5">
      <div className="d-flex align-items-center mb-3">
        <h2 className="me-auto">Profile</h2>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={() => navigate(-1)}>Back</button>
          <button className="btn btn-outline-primary" onClick={() => fetchProfile()}>Refresh</button>
        </div>
      </div>
      {isEditing ? (
        <>
          <input
            type="text"
            placeholder="Username"
            value={profile.username}
            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
            className="form-control mb-2"
          />
          <input
            type="email"
            placeholder="Email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="form-control mb-2"
          />
          <button onClick={handleSave} className="btn btn-success">Save</button>
          <button onClick={() => setIsEditing(false)} className="btn btn-secondary ml-2">Cancel</button>
        </>
      ) : (
        <>
          <p><strong>Username:</strong> {profile.username}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Role:</strong> {profile.role}</p>
          <button onClick={() => setIsEditing(true)} className="btn btn-primary">Edit Profile</button>
        </>
      )}
    </div>
  );
}

export default Profile;