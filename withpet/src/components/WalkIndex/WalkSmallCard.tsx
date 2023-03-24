import spritesIcon from 'assets/sprites_icon.png'
import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'redux/store'
import {
  getWalkLocation,
  getWalkLoading,
  getWalkWeather,
  updateTemp,
  updateRain,
  updateAir,
} from 'redux/slice/walkIndex/walkIndexSlice'
interface locationType {
  loaded: boolean
  coordinates?: { lat: number; lng: number }
  error?: { code: number; message: string }
}

const WalkSmallCard = () => {
  const [location, setLocation] = useState<locationType>({
    loaded: false,
    coordinates: { lat: 0, lng: 0 },
  })
  const weather = useSelector(
    (walkState: RootState) => walkState.walk.walkWeather,
  )
  const loading = useSelector(
    (walkState: RootState) => walkState.walk.walkLoading,
  )
  const SMCARD = useSelector(
    (walkState: RootState) => walkState.walk.walkSMCARD,
  )
  const loca = useSelector(
    (walkState: RootState) => walkState.walk.walkLocation,
  )
  const dispatch = useDispatch()

  const onSuccess = (location: {
    coords: { latitude: number; longitude: number }
  }) => {
    setLocation({
      loaded: true,
      coordinates: {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      },
    })
    dispatch(
      getWalkLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      }),
    )
  }

  const onError = (error: { code: number; message: string }) => {
    setLocation({
      loaded: true,
      error,
    })
  }

  const currentWeather = async (lat: string, lon: string) => {
    try {
      const url = new URL(
        `https://api.openweathermap.org/data/2.5/weather?lang=kr&units=metric&lat=${lat}&lon=${lon}&appid=${process.env.REACT_APP_WEATHER_API}`,
      )
      dispatch(getWalkLoading(true))
      const response = await fetch(url)
      const data = await response.json()
      const temp = Math.floor(data.main.temp)
      const rain = data.rain === undefined ? 0 : data.rain[0][0]
      dispatch(getWalkWeather({ ...weather, temp, rain }))
      dispatch(updateTemp(temp))
      dispatch(updateRain(rain))
      dispatch(getWalkLoading(false))
    } catch (err: any) {
      console.error(err.message)
      dispatch(getWalkLoading(false))
    }
  }

  const currentAirQuality = async (lat: string, lon: string) => {
    try {
      const url = new URL(
        `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${process.env.REACT_APP_AIRQUALITY_API}`,
      )
      dispatch(getWalkLoading(true))
      const response = await fetch(url)
      const data = await response.json()
      const airQuality = data.data.aqi
      dispatch(updateAir(airQuality))
      dispatch(getWalkLoading(false))
    } catch (err: any) {
      console.error(err.message)
      dispatch(getWalkLoading(false))
    }
  }

  const getCurrentLocation = () =>
    new Promise(res => {
      if (!('geolocation' in navigator)) {
        onError({
          code: 0,
          message: 'Geolocation not supported',
        })
      }
      res(navigator.geolocation.getCurrentPosition(onSuccess, onError))
    })

  useEffect(() => {
    getCurrentLocation().then(() => {
      currentWeather(loca.lat, loca.lng)
      currentAirQuality(loca.lat, loca.lng)
    })
  }, [])

  return (
    <div className="flex justify-center gap-6 mt-20">
      {loading
        ? ' '
        : SMCARD.map((data, idx) => (
            <div
              className="bg-white w-28 h-32 flex flex-col items-center justify-center rounded-xl p-4"
              key={idx}
            >
              <div
                style={{
                  backgroundImage: `url(${spritesIcon})`,
                  backgroundPosition: `${data.position}`,
                  width: `${data.width}`,
                  height: `${data.height}`,
                  marginBottom: '8px',
                }}
              ></div>
              <h3>{data.title}</h3>
              <p>
                {data.count}
                {data.unit}
              </p>
            </div>
          ))}
    </div>
  )
}

export default WalkSmallCard
