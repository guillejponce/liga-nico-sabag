import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminMatchdayModal = ({ matchday, onSave, onCancel }) => {
  const [date, setDate] = useState('');

  useEffect(() => {
    if (matchday && matchday.date_time) {
      // Convert the stored UTC date_time to YYYY-MM-DD format
      const dateObj = new Date(matchday.date_time);
      const localDateStr = dateObj.toISOString().slice(0, 10);
      setDate(localDateStr);
    }
  }, [matchday]);

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      if (!date) {
        throw new Error('Date is required');
      }
      
      // Parse the input date (which is in YYYY-MM-DD format)
      const [year, month, day] = date.split('-').map(Number);
      // Create a UTC date at midnight for the selected date
      const dateTime = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      
      const updateData = {
        date_time: dateTime.toISOString(),
        phase: matchday.phase // Preserve the existing phase
      };

      console.log('Submitting matchday update:', updateData);
      onSave(updateData);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error(error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Edit Matchday Date</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminMatchdayModal;
