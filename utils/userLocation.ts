import { useEffect, useState } from 'react';
import axios from 'axios';

export const useUserLocation = (): string => {
  const [currentLocation, setCurrentLocation] = useState('');
  console.log('current locaton',currentLocation);

  useEffect(() => {
    const fetchUserLocation = async (): Promise<void> => {
      try {
        const response = await axios.get('https://ipapi.co/json');
        const { country_name } = response.data;
        setCurrentLocation(country_name);
      } catch (error) { 
        console.error('Error fetching user location:', error);
      }
    };

    fetchUserLocation();
  }, []);

  return currentLocation;
};
