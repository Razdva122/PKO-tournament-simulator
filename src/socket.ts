/* eslint-disable */
import { io } from 'socket.io-client'

export const socketURL = true ? '158.160.37.112' : 'localhost:3000'

export const socket = io(socketURL, {
  withCredentials: true
})
