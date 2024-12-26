/* eslint-disable */
import { io } from 'socket.io-client'

export const socketURL = process.env.NODE_ENV === 'production' ? 'pkotournamentsbackend.online:3000' : 'localhost:3000'

export const socket = io(socketURL, {
  withCredentials: true
})
