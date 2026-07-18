import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';

const BookAppointment = () => {
  const [dentists, setDentists] = useState([]);
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingSlots, setIsCheckingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [profileModal, setProfileModal] = useState({ isOpen: false, dentist: null });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  // Get tomorrow's date formatted as YYYY-MM-DD for the date picker minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  useEffect(() => {
    const fetchDentists = async () => {
      try {
        const res = await api.get('/users/dentists/list');
        if (res.data.success) {
          setDentists(res.data.data.dentists);
        }
      } catch (err) {
        setError('Failed to load dentists. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDentists();
  }, []);

  // Check availability when dentist and date are selected
  useEffect(() => {
    const checkAvailability = async () => {
      if (!selectedDentist || !selectedDate) return;
      
      setIsCheckingSlots(true);
      setSelectedSlot('');
      
      try {
        const res = await api.get(`/appointments/availability?dentistId=${selectedDentist._id}&date=${selectedDate}`);
        if (res.data.success) {
          setAvailableSlots(res.data.data.availableSlots);
        }
      } catch (err) {
        setError('Failed to fetch available slots.');
        setAvailableSlots([]);
      } finally {
        setIsCheckingSlots(false);
      }
    };
    
    checkAvailability();
  }, [selectedDentist, selectedDate]);

  const handleBook = async () => {
    if (!selectedDentist || !selectedDate || !selectedSlot) return;
    
    setIsBooking(true);
    setError('');
    
    try {
      const res = await api.post('/appointments', {
        dentistId: selectedDentist._id,
        date: selectedDate,
        timeSlot: selectedSlot
      });
      
      if (res.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment. The slot might have been taken.');
      // Re-fetch slots just in case
      setAvailableSlots(prev => prev.filter(s => s !== selectedSlot));
      setSelectedSlot('');
    } finally {
      setIsBooking(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-10 text-center font-body">
        <div className="bg-surface-container rounded-xl p-8 shadow-[0_0_30px_rgba(0,219,231,0.1)] border border-primary/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
          <div className="w-16 h-16 bg-primary-container/20 border border-primary/50 text-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(0,242,255,0.4)]">
            <span className="material-symbols-outlined text-[32px]">check_circle</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-primary mb-2 text-glow">Booking Confirmed!</h2>
          <p className="text-on-surface-variant mb-8 max-w-md mx-auto text-sm">
            Your appointment request has been sent to Dr. {selectedDentist?.name}. 
            You can view its status in your appointments list.
          </p>
          <button
            onClick={() => navigate('/patient/appointments')}
            className="px-6 py-3 bg-primary-container hover:bg-primary text-on-primary-container font-display font-semibold rounded-lg btn-glow transition-all"
          >
            View Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-body">
      
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-surface-container rounded-lg border border-outline-variant/50 hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-primary">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-on-surface">Book Appointment</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Select a dentist, choose a date, and pick a time slot.</p>
        </div>
      </div>

      {error && (
        <div className="bg-error-container/20 text-error p-4 rounded-xl border border-error/50 flex items-start text-sm">
          <span className="material-symbols-outlined mr-2 flex-shrink-0">warning</span>
          {error}
        </div>
      )}

      {/* Step 1: Select Dentist */}
      <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-6">
        <h2 className="text-lg font-display font-bold text-on-surface mb-4 flex items-center">
          <span className="w-6 h-6 rounded-full bg-primary-container/20 text-primary border border-primary/30 flex items-center justify-center text-xs mr-2 font-mono">01</span>
          Select Operator
        </h2>
        
        {isLoading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-xl bg-surface-container-high h-24 w-1/2"></div>
            <div className="rounded-xl bg-surface-container-high h-24 w-1/2"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dentists.map(dentist => (
              <div 
                key={dentist._id}
                onClick={() => setSelectedDentist(dentist)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedDentist?._id === dentist._id 
                    ? 'border-primary bg-primary/10 shadow-[inset_0_0_20px_rgba(0,219,231,0.1)]' 
                    : 'border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-highest/50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center border overflow-hidden ${selectedDentist?._id === dentist._id ? 'bg-primary-container/20 text-primary border-primary/30' : 'bg-surface-dim text-on-surface-variant border-outline-variant/50'}`}>
                    {dentist.profile?.avatarUrl ? (
                      <img src={dentist.profile.avatarUrl} alt={dentist.name} className="w-full h-full object-cover mix-blend-screen" />
                    ) : (
                      <span className="material-symbols-outlined text-[24px]">person</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-on-surface">Dr. {dentist.name}</h3>
                    <p className="text-xs font-mono text-primary-fixed-dim mt-0.5 tracking-wider uppercase">{dentist.profile?.specialization || 'General Dentist'}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileModal({ isOpen: true, dentist });
                    }}
                    className="p-2 bg-primary/5 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors flex-shrink-0"
                    title="View Full Profile"
                  >
                    <span className="material-symbols-outlined text-[20px]">person_search</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Select Date & Time */}
      {selectedDentist && (
        <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-6 animate-fade-in">
          <h2 className="text-lg font-display font-bold text-on-surface mb-4 flex items-center">
            <span className="w-6 h-6 rounded-full bg-primary-container/20 text-primary border border-primary/30 flex items-center justify-center text-xs mr-2 font-mono">02</span>
            Schedule Uplink
          </h2>
          
          <div className="mb-6">
            <label className="block text-xs font-mono text-on-surface-variant mb-2 uppercase tracking-widest">Select Date</label>
            <div className="relative max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">calendar_month</span>
              </div>
              <input
                type="date"
                min={minDate}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                onClick={(e) => {
                  try {
                    if (e.target.showPicker) e.target.showPicker();
                  } catch (err) {
                    // Ignore error if already showing
                  }
                }}
                className="block w-full pl-10 pr-3 py-2.5 bg-layer-0 border border-outline-variant/50 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-on-surface font-mono text-sm transition-colors input-glow cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>

          {selectedDate && (
            <div>
              <label className="block text-xs font-mono text-on-surface-variant mb-2 uppercase tracking-widest">Available Time Slots</label>
              
              {isCheckingSlots ? (
                <div className="flex items-center space-x-2 text-sm text-primary">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <span className="font-mono">Syncing calendar...</span>
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {availableSlots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-2 text-sm font-mono rounded-lg border transition-all ${
                        selectedSlot === slot 
                          ? 'bg-primary-container/20 text-primary border-primary shadow-[0_0_10px_rgba(0,219,231,0.3)] font-bold' 
                          : 'bg-surface-container-highest/30 text-on-surface border-outline-variant/30 hover:border-primary/50 hover:text-primary'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-center text-on-surface-variant text-sm font-mono">
                  No slots available on this date. Please choose another date.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      {selectedSlot && (
        <div className="bg-surface-container-high rounded-xl border border-primary/50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between animate-fade-in sticky bottom-6 z-10 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          <div className="mb-4 sm:mb-0">
            <p className="text-xs font-mono text-on-surface-variant uppercase tracking-widest mb-1">Confirm Configuration</p>
            <p className="font-bold font-display text-on-surface text-lg">Dr. {selectedDentist?.name}</p>
            <p className="text-sm text-primary font-mono">{new Date(selectedDate).toLocaleDateString()} @ {selectedSlot}</p>
          </div>
          <button
            onClick={handleBook}
            disabled={isBooking}
            className="w-full sm:w-auto px-8 py-3 bg-primary-container text-on-primary-container font-display font-semibold rounded-lg hover:bg-primary transition-all disabled:opacity-70 flex items-center justify-center btn-glow"
          >
            {isBooking ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin mr-2"></div>
                INITIATING...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined mr-2 text-[20px]">send</span>
                CONFIRM UPLINK
              </>
            )}
          </button>
        </div>
      )}

      {profileModal.isOpen && profileModal.dentist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-surface-container border border-outline-variant/30 rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(0,219,231,0.1)] overflow-hidden">
            <div className="relative h-24 bg-surface-container-high border-b border-outline-variant/30">
              <div className="absolute inset-0 grid-pattern opacity-10"></div>
              <button onClick={() => setProfileModal({ isOpen: false, dentist: null })} className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors bg-layer-0/50 rounded-full p-1 backdrop-blur-sm">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="px-6 pb-6 relative">
              <div className="flex items-end -mt-12 mb-4">
                <div className="w-24 h-24 rounded-2xl bg-layer-0 border-4 border-surface-container flex items-center justify-center overflow-hidden shadow-lg z-10">
                  {profileModal.dentist.profile?.avatarUrl ? (
                    <img src={profileModal.dentist.profile.avatarUrl} alt={profileModal.dentist.name} className="w-full h-full object-cover mix-blend-screen" />
                  ) : (
                    <span className="material-symbols-outlined text-[40px] text-on-surface-variant">person</span>
                  )}
                </div>
                <div className="ml-4 mb-2 flex-1">
                  <h2 className="text-2xl font-display font-bold text-on-surface leading-tight">Dr. {profileModal.dentist.name}</h2>
                  <p className="text-sm font-mono text-primary-fixed-dim uppercase tracking-wider">{profileModal.dentist.profile?.department || profileModal.dentist.profile?.specialization}</p>
                </div>
              </div>
              
              <div className="space-y-4 font-body">
                <div>
                  <h3 className="text-xs font-mono text-on-surface-variant uppercase tracking-widest mb-1.5">Biography</h3>
                  <p className="text-sm text-on-surface leading-relaxed opacity-90">{profileModal.dentist.profile?.bio || 'No biography provided.'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container-highest/30 p-3 rounded-xl border border-outline-variant/20">
                    <h3 className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest mb-1">Education</h3>
                    <p className="text-sm text-on-surface font-medium">{profileModal.dentist.profile?.education || 'N/A'}</p>
                  </div>
                  <div className="bg-surface-container-highest/30 p-3 rounded-xl border border-outline-variant/20">
                    <h3 className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest mb-1">Experience</h3>
                    <p className="text-sm text-on-surface font-medium">{profileModal.dentist.profile?.experience || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="bg-surface-container-highest/30 p-3 rounded-xl border border-outline-variant/20">
                  <h3 className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest mb-1 flex items-center"><span className="material-symbols-outlined text-[14px] mr-1">translate</span> Languages</h3>
                  <p className="text-sm text-on-surface font-medium">{profileModal.dentist.profile?.languages || 'English'}</p>
                </div>
                
                <div className="pt-4 border-t border-outline-variant/30 flex justify-end">
                  <button 
                    onClick={() => {
                      setSelectedDentist(profileModal.dentist);
                      setProfileModal({ isOpen: false, dentist: null });
                    }}
                    className="px-6 py-2.5 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/50 transition-all rounded-lg font-display font-bold text-sm"
                  >
                    Select Operator
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
