import axiosPrepare from './axios'
import axios, { AxiosResponse, CancelToken, CancelTokenSource } from 'axios'
import { getUser } from './useUserLocalStorage'

interface User {
  token_type: string
  token: string
}

interface Headers {
  headers: {
    'Content-Type': string
    Authorization: string
    CacheControl: string
    Pragma?: string
    Expires?: string
  }
  cancelToken: CancelToken
}

const getHeader = async (ourRequestToken: CancelToken | null = null): Promise<Headers> => {
  const user: User | null = await getUser()
  const source: CancelTokenSource = axios.CancelToken.source()
  let header: Headers
  if (user) {
    header = {
      headers: {
        'Content-Type': 'application/json',
        CacheControl: 'no-cache',
        Authorization: `${user?.token_type || 'Bearer'} ${user.token}`,
        Pragma: 'no-cache',
        Expires: '0',
      },
      cancelToken: ourRequestToken ? ourRequestToken : source.token,
    }
  } else {
    header = {
      headers: {
        'Content-Type': 'application/json',
        CacheControl: 'no-cache',
        Authorization: '',
        Pragma: 'no-cache',
        Expires: '0',
      },
      cancelToken: ourRequestToken ? ourRequestToken : source.token,
    }
  }
  return header
}

export function getToken() {
  const user: User | null = getUser()
  if (user) {
    return user.token
  }
  return ''
}

export async function get(
  url: string,
  type: boolean = false,
  ourRequestToken: CancelToken | null = null,
  controller: AbortController | null = null,
  data: any = null,
): Promise<AxiosResponse> {
  const header: Headers = await getHeader(ourRequestToken)

  ///console.log(header,data, type);

  return await axiosPrepare.get(
    url,
    type
      ? {
          ...header,
          signal: controller?.signal,
          params: data,
        }
      : {
          cancelToken: ourRequestToken ? ourRequestToken : undefined,
          signal: controller?.signal,
          data: data,
        },
  )
}

export async function delete_(url: string, type: boolean = false): Promise<AxiosResponse> {
  const header: Headers = await getHeader()
  return await axiosPrepare.delete(url, type ? header : {})
}

export default async function post(
  url: string,
  data: any = null,
  type: boolean = false,
  ourRequestToken: CancelToken | null = null,
  controller: AbortController | null = null,
): Promise<AxiosResponse> {
  const header: Headers = await getHeader(ourRequestToken)

  return await axiosPrepare.post(
    url,
    data,
    type
      ? {
          ...header,
          signal: controller?.signal,
        }
      : {
          cancelToken: ourRequestToken ? ourRequestToken : undefined,
          signal: controller?.signal,
        },
  )
}
// form data
export async function postFormData(url: string, props: any, type: boolean = false): Promise<AxiosResponse> {
  // await csrf();
  const header: Headers = await getHeader()
  return await axiosPrepare.postForm(url, props, type ? header : {})
}

export async function put(url: string, props: any, type: boolean = false): Promise<AxiosResponse> {
  // await csrf();
  const header: Headers = await getHeader()
  return await axiosPrepare.put(url, props, type ? header : {})
}
