import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLearners, getActiveTrips } from '../db/transportApi';
import { useAuth } from '../hooks/useAuth';
import Icon from './Icon';

export default function TransportWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [learnerCount, setLearnerCount] = useState(0);
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!user?.id) { setLoading(false); return; }
    getLearners(user.id).then(({ data }) => {
      setLearnerCount((data || []).length);
      if (data?.length > 0 && data[0].route_id) {
        getActiveTrips(data[0].route_id).then(({ data: trips }) => {
          setActiveTrip(trips?.[0] || null);
          setLoading(false);
        });
      } else setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (loading) return null;

  return (
    <div
      onClick={() => navigate('/edutrans')}
      className={`card cursor-pointer border-l-4 ${
        activeTrip ? 'border-l-safety-500 bg-safety-50' : 'border-l-blue-400 bg-blue-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚌</span>
          <div>
            <span className="text-sm font-bold text-gray-800">EduTrans</span>
            {activeTrip ? (
              <p className="text-xs text-safety-700">🚌 Trip active — tracking</p>
            ) : learnerCount > 0 ? (
              <p className="text-xs text-gray-500">{learnerCount} child{learnerCount > 1 ? 'ren' : ''} registered</p>
            ) : (
              <p className="text-xs text-gray-500">School transport tracking</p>
            )}
          </div>
        </div>
        <Icon name="chevronRight" className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
}
