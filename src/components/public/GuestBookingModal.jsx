import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GuestBookingModal({ onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    onClose?.();
    navigate('/signup/customer');
  }, []);

  return null;
}