/*
 * <<
 * Davinci
 * ==
 * Copyright (C) 2016 - 2017 EDP
 * ==
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * >>
 */

import omit from 'lodash/omit'
import { takeLatest, takeEvery } from 'redux-saga'
import { call, put, all } from 'redux-saga/effects'
import {
  LOAD_SHARE_DASHBOARD,
  LOAD_SHARE_WIDGET,
  LOAD_SHARE_RESULTSET,
  LOAD_WIDGET_CSV,
  LOAD_SELECT_OPTIONS,
  LOAD_DOWNLOAD_LIST,
  DOWNLOAD_FILE,
  INITIATE_DOWNLOAD_TASK,
  EXECUTE_QUERY,
  GET_PROGRESS,
  GET_RESULT,
  GET_BASE_INFO
} from './constants'
import {
  dashboardGetted,
  loadDashboardFail,
  widgetGetted,
  resultsetGetted,
  getResultsetFail,
  widgetCsvLoaded,
  loadWidgetCsvFail,
  selectOptionsLoaded,
  loadSelectOptionsFail,
  downloadListLoaded,
  loadDownloadListFail,
  fileDownloaded,
  downloadFileFail,
  DownloadTaskInitiated,
  initiateDownloadTaskFail,
  executeQuerySuccess,
  executeQueryFail,
  getProgressSuccess,
  getProgressFail,
  getResultSuccess,
  getResultFail,
  getBaseInfoLoaded,
  loadGetBaseInfoFail,
} from './actions'

import request from '../../../app/utils/request'
import { errorHandler, getErrorMessage } from '../../../app/utils/util'
import api from '../../../app/utils/api'
import config, { env } from 'app/globalConfig'
import { IDistinctValueReqeustParams } from '../../../app/components/Filters/types'
import { message } from 'antd'
const shareHost = config[env].shareHost

export function* getDashboard (action) {
  const { payload } = action
  try {
    const dashboard = yield call(request, `${api.share}/dashboard/${payload.token}`)
    yield put(dashboardGetted(dashboard.payload))
  } catch (err) {
    yield put(loadDashboardFail())
    errorHandler(err)
    payload.reject(err)
  }
}

export function* getWidget (action) {
  const { payload } = action
  try {
    const widget = yield call(request, `${api.share}/widget/${payload.token}`)
    yield put(widgetGetted(widget.payload))

    if (payload.resolve) {
      payload.resolve(widget.payload)
    }
  } catch (err) {
    errorHandler(err)
    payload.reject(err)
  }
}

// 请求dss的接口 获取用户名等基本信息
export function* getBaseInfo (action) {
  const { resolve } = action.payload
  // 这里比较特殊 是请求dss的接口 地址要换下
  let url = api.projects
  url = url.replace('rest_s', 'rest_j')
  url = url.replace('visualis', 'dss/framework/admin/user')
  url = url.replace('projects', 'userInfo')
  try {
    const asyncData = yield call(request, url)
    yield put(getBaseInfoLoaded())
    if (asyncData.data) {
      resolve(asyncData.data)
    } else {
      resolve({})
    }
  } catch (err) {
    yield put(loadGetBaseInfoFail())
    errorHandler(err)
  }
}

// dashboard share页里，获取widget数据
export function* getResultset (action) {
  const { payload } = action
  const { renderType, itemId, dataToken, requestParams } = payload
  const {
    filters,
    tempFilters,
    linkageFilters,
    globalFilters,
    variables,
    linkageVariables,
    globalVariables,
    pagination,
    ...rest
  } = requestParams
  const { pageSize, pageNo } = pagination || { pageSize: 0, pageNo: 0 }

  try {
    const resultset = yield call(request, {
      method: 'post',
      url: `${api.share}/data/${dataToken}`,
      data: {
        ...omit(rest, 'customOrders'),
        filters: filters.concat(tempFilters).concat(linkageFilters).concat(globalFilters),
        params: variables.concat(linkageVariables).concat(globalVariables),
        pageSize,
        pageNo
      }
    })
    const { resultList } = resultset.payload
    resultset.payload.resultList = (resultList && resultList.slice(0, 600)) || []
    yield put(resultsetGetted(renderType, itemId, requestParams, resultset.payload))
  } catch (err) {
    yield put(getResultsetFail(itemId, getErrorMessage(err)))
  }
}

export function* executeQuery (action) {
  const { payload } = action
  const { renderType, itemId, dataToken, requestParams, resolve, reject } = payload
  const {
    filters,
    tempFilters,
    linkageFilters,
    globalFilters,
    variables,
    linkageVariables,
    globalVariables,
    pagination,
    ...rest
  } = requestParams
  const { pageSize, pageNo } = pagination || { pageSize: 0, pageNo: 0 }

  try {
    const url = payload.parameters ? `${api.share}/data/${dataToken}?parameters=${payload.parameters}` : `${api.share}/data/${dataToken}`
    const asyncData = yield call(request, {
      method: 'post',
      url,
      data: {
        ...omit(rest, 'customOrders'),
        filters: filters.concat(tempFilters).concat(linkageFilters).concat(globalFilters),
        params: variables.concat(linkageVariables).concat(globalVariables),
        pageSize,
        pageNo
      }
    })
    yield put(executeQuerySuccess(renderType, itemId, requestParams, asyncData.payload))
    // asyncData.payload可能为""
    if (asyncData.payload) {
      resolve(asyncData.payload)
    } else {
      resolve({})
    }
  } catch (err) {
    yield put(executeQueryFail(itemId, getErrorMessage(err)))
    reject(err)
  }
}

export function* getProgress (action) {
  const { payload } = action
  const { execId, resolve, reject } = payload
  try {
    const asyncData = yield call(request, {
      method: 'post',
      url: `${api.view}/${execId}/getprogress`,
      data: {}
    })
    yield put(getProgressSuccess())
    // asyncData.payload可能为""
    if (asyncData.payload) {
      resolve(asyncData.payload)
    } else {
      resolve({})
    }
  } catch (err) {
    yield put(getProgressFail(getErrorMessage(err)))
    reject(err)
  }
}

export function* getResult (action) {
  const { payload } = action
  const { execId, renderType, itemId, requestParams, resolve, reject } = payload
  try {
    const asyncData = yield call(request, {
      method: 'post',
      url: `${api.view}/${execId}/getresult`,
      data: {
        pageNo: requestParams && requestParams.pagination && requestParams.pagination.pageNo ? requestParams.pagination.pageNo : 1,
        pageSize: requestParams && requestParams.pagination && requestParams.pagination.pageSize ? requestParams.pagination.pageSize : 5000
      }
    })
    // asyncData.payload可能为""
    if (asyncData.payload) {
      const { resultList } = asyncData.payload
      asyncData.payload.resultList = (resultList && resultList.slice(0, 600)) || []
      resolve(asyncData.payload)
    } else {
      resolve({})
    }
    yield put(getResultSuccess(renderType, itemId, requestParams, asyncData.payload))
  } catch (err) {
    yield put(getResultFail(itemId, getErrorMessage(err)))
    reject(err)
  }
}
export function* getWidgetCsv (action) {
  const { itemId, requestParams, token } = action.payload
  const { filters, tempFilters, linkageFilters, globalFilters, variables, linkageVariables, globalVariables, ...rest } = requestParams

  try {
    const path = yield call(request, {
      method: 'post',
      url: `${api.share}/csv/${token}`,
      data: {
        ...rest,
        filters: filters.concat(tempFilters).concat(linkageFilters).concat(globalFilters),
        params: variables.concat(linkageVariables).concat(globalVariables)
      }
    })
    yield put(widgetCsvLoaded(itemId))
    location.href = path.payload
    // location.href = `data:application/octet-stream,${encodeURIComponent(asyncData)}`
  } catch (err) {
    yield put(loadWidgetCsvFail(itemId))
    errorHandler(err)
  }
}

export function* getSelectOptions (action) {
  try {
    const { payload } = action
    const { controlKey, dataToken, requestParams, itemId } = payload
    const requestParamsMap: Array<[string, IDistinctValueReqeustParams]> = Object.entries(requestParams)
    const requests = requestParamsMap.map(([viewId, params]: [string, IDistinctValueReqeustParams]) => {
      const { columns, filters, variables, cache, expired } = params
      return call(request, {
        method: 'post',
        url: `${api.share}/data/${dataToken}/distinctvalue/${viewId}`,
        data: {
          columns,
          filters,
          params: variables,
          cache,
          expired
        }
      })
    })
    const results = yield all(requests)
    const values = results.reduce((payloads, r, index) => {
      const { columns } = requestParamsMap[index][1]
      if (columns.length === 1) {
        return payloads.concat(r.payload.map((obj) => obj[columns[0]]))
      }
      return payloads
    }, [])
    yield put(selectOptionsLoaded(controlKey, Array.from(new Set(values)), itemId))
  } catch (err) {
    yield put(loadSelectOptionsFail(err))
    // errorHandler(err)
  }
}

export function* getDownloadList (action): IterableIterator<any> {
  const { shareClinetId, token } = action.payload
  try {
    const result = yield call(request, `${api.download}/share/page/${shareClinetId}/${token}`)
    yield put(downloadListLoaded(result.payload))
  } catch (err) {
    yield put(loadDownloadListFail(err))
    errorHandler(err)
  }
}

export function* downloadFile (action): IterableIterator<any> {
  const { id, shareClinetId, token } = action.payload
  try {
    location.href = `${api.download}/share/record/file/${id}/${shareClinetId}/${token}`
    yield put(fileDownloaded(id))
  } catch (err) {
    yield put(downloadFileFail(err))
    errorHandler(err)
  }
}

export function* initiateDownloadTask (action): IterableIterator<any> {
  const { shareClientId, dataToken, type, itemId } = action.payload
  try {
    const downloadParams = action.payload.downloadParams.map((params) => {
      const {
        id,
        filters,
        tempFilters,
        linkageFilters,
        globalFilters,
        variables,
        linkageVariables,
        globalVariables,
        ...rest
      } = params
      return {
        id,
        param: {
          ...rest,
          filters: filters.concat(tempFilters).concat(linkageFilters).concat(globalFilters),
          params: variables.concat(linkageVariables).concat(globalVariables)
        }
      }
    })
    yield call(request, {
      method: 'POST',
      url: `${api.download}/share/submit/${type}/${shareClientId}/${dataToken}`,
      data: downloadParams
    })
    message.success('下载任务创建成功！')
    yield put(DownloadTaskInitiated(type, itemId))
  } catch (err) {
    yield put(initiateDownloadTaskFail(err))
    errorHandler(err)
  }
}

export default function* rootDashboardSaga (): IterableIterator<any> {
  yield [
    takeLatest(LOAD_SHARE_DASHBOARD, getDashboard),
    takeEvery(GET_BASE_INFO, getBaseInfo as any),
    takeEvery(LOAD_SHARE_WIDGET, getWidget),
    takeEvery(LOAD_SHARE_RESULTSET, getResultset),
    takeEvery(EXECUTE_QUERY, executeQuery),
    takeEvery(GET_PROGRESS, getProgress),
    takeEvery(GET_RESULT, getResult),
    takeLatest(LOAD_WIDGET_CSV, getWidgetCsv),
    takeEvery(LOAD_SELECT_OPTIONS, getSelectOptions),
    takeLatest(LOAD_DOWNLOAD_LIST, getDownloadList),
    takeLatest(DOWNLOAD_FILE, downloadFile),
    takeEvery(INITIATE_DOWNLOAD_TASK, initiateDownloadTask)
  ]
}
