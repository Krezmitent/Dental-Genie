import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const UserManagement = () => {
  const [dentists, setDentists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users/dentists/list');
        if (res.data.success) {
          setDentists(res.data.data.dentists);
        }
      } catch (err) {
        console.error("Failed to fetch users");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleApproval = async (id, status) => {
    try {
      // Assuming a route exists to update verification status (we'd build this in backend)
      // For demo, we'll optimistically update the UI.
      // await api.put(`/admin/users/${id}/verify`, { status });
      
      setDentists(dentists.map(d => 
        d._id === id ? { ...d, profile: { ...d.profile, verificationStatus: status } } : d
      ));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const filteredDentists = dentists.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-body">
      <div>
        <h1 className="text-2xl font-display font-bold text-on-surface">Access Management</h1>
        <p className="text-on-surface-variant mt-1 text-sm font-mono tracking-widest uppercase">Approve operators and manage network access.</p>
      </div>

      <div className="bg-surface-container rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="p-4 border-b border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-lowest">
          <h2 className="text-lg font-display font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">shield_person</span>
            Operator Accounts
          </h2>
          <div className="relative w-full sm:max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">search</span>
            </div>
            <input
              type="text"
              placeholder="Search operators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-layer-0 border border-outline-variant/50 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-on-surface font-mono text-sm transition-colors input-glow uppercase tracking-wider"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
             <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-outline-variant/20">
              <thead className="bg-surface-container-lowest">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-widest">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-widest">Specialization</th>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-widest">License</th>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-widest">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-surface-container divide-y divide-outline-variant/10">
                {filteredDentists.map(dentist => (
                  <tr key={dentist._id} className="hover:bg-surface-container-high transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-layer-0 border border-outline-variant/30 rounded-lg flex items-center justify-center text-on-surface-variant">
                           <span className="material-symbols-outlined text-[20px]">person</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-display font-bold text-on-surface">Dr. {dentist.name}</div>
                          <div className="text-xs font-mono text-on-surface-variant mt-0.5 tracking-wider">{dentist.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-mono text-on-surface uppercase tracking-widest">{dentist.profile?.specialization || 'General'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-on-surface-variant tracking-wider">
                      {dentist.profile?.licenseNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-[10px] font-mono font-bold uppercase tracking-widest border rounded ${
                        dentist.profile?.verificationStatus === 'verified' 
                          ? 'bg-primary-container/10 text-primary border-primary/30 shadow-[inset_0_0_10px_rgba(0,219,231,0.1)]' 
                          : dentist.profile?.verificationStatus === 'rejected'
                          ? 'bg-error-container/10 text-error border-error/30'
                          : 'bg-tertiary-container/10 text-tertiary-fixed-dim border-tertiary/30 shadow-[inset_0_0_10px_rgba(254,216,58,0.1)]'
                      }`}>
                        {dentist.profile?.verificationStatus || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      {dentist.profile?.verificationStatus !== 'verified' && (
                        <button 
                          onClick={() => handleApproval(dentist._id, 'verified')}
                          className="text-primary hover:text-primary-fixed-dim font-mono text-xs uppercase tracking-widest transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {dentist.profile?.verificationStatus !== 'rejected' && (
                        <button 
                          onClick={() => handleApproval(dentist._id, 'rejected')}
                          className="text-error hover:text-error-container font-mono text-xs uppercase tracking-widest transition-colors"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDentists.length === 0 && (
              <div className="p-8 text-center text-on-surface-variant font-mono text-sm uppercase tracking-widest bg-surface-container-lowest/50">No operators found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
