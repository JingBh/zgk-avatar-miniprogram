class IllegalArgumentError extends Error {
  constructor(error) {
    super(IllegalArgumentError.errors[error])

    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)

    this.error = error
  }

  static errors = {
    'TEXT_3_TO_4': '应为 3-4 个汉字',
    'TEXT_4_TO_8': '应为 4-8 个汉字'
  }
}

class CharacterNotFoundError extends Error {
  constructor(char) {
    super(`不支持的字符：${char}`)

    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)

    this.char = char
  }
}

const errorToResponse = (error, status) => {
  status = status || 500
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json'
    },
    isBase64Encoded: false,
    body: JSON.stringify({
      success: false,
      message: error.message
    })
  }
}

module.exports = {
  IllegalArgumentError,
  CharacterNotFoundError,
  errorToResponse
}
