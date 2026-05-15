import '@testing-library/jest-dom'

// jsdom no implementa URL.createObjectURL (API de blob URLs del navegador)
global.URL.createObjectURL = () => 'blob:fake-object-url'
global.URL.revokeObjectURL = () => undefined
