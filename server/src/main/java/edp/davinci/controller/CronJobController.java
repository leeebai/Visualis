/*
 * <<
 *  Davinci
 *  ==
 *  Copyright (C) 2016 - 2019 EDP
 *  ==
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *        http://www.apache.org/licenses/LICENSE-2.0
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *  >>
 *
 */

package edp.davinci.controller;


import edp.core.annotation.CurrentUser;
import edp.core.annotation.MethodLog;
import edp.davinci.common.controller.BaseController;
import edp.davinci.core.common.Constants;
import edp.davinci.core.common.ResultMap;
import edp.davinci.dto.cronJobDto.CronJobBaseInfo;
import edp.davinci.dto.cronJobDto.CronJobInfo;
import edp.davinci.dto.cronJobDto.CronJobUpdate;
import edp.davinci.model.CronJob;
import edp.davinci.model.User;
import edp.davinci.service.CronJobService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;

@Slf4j
@RestController
@RequestMapping(value = Constants.BASE_API_PATH + "/cronjobs", produces = MediaType.APPLICATION_JSON_VALUE)
public class CronJobController extends BaseController {

    @Autowired
    private CronJobService cronJobService;

    /**
     * 获取cronjob列表
     *
     * @param projectId
     * @param user
     * @param request
     * @return
     */
    @MethodLog
    @GetMapping
    public ResponseEntity getCronJobs(@RequestParam Long projectId,
                                      @CurrentUser User user,
                                      HttpServletRequest request) {
        if (invalidId(projectId)) {
            ResultMap resultMap = new ResultMap(tokenUtils).failAndRefreshToken(request).message("Invalid project id");
            return ResponseEntity.status(resultMap.getCode()).body(resultMap);
        }
        List<CronJob> cronJobs = cronJobService.getCronJobs(projectId, user);
        return ResponseEntity.ok(new ResultMap(tokenUtils).successAndRefreshToken(request).payloads(cronJobs));
    }


    /**
     * 创建 cronjob
     *
     * @param cronJob
     * @param bindingResult
     * @param user
     * @param request
     * @return
     */
    @MethodLog
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity createCronJob(@Valid @RequestBody CronJobBaseInfo cronJob,
                                        BindingResult bindingResult,
                                        @CurrentUser User user,
                                        HttpServletRequest request) {

        if (bindingResult.hasErrors()) {
            ResultMap resultMap = new ResultMap(tokenUtils).failAndRefreshToken(request).message(bindingResult.getFieldErrors().get(0).getDefaultMessage());
            return ResponseEntity.status(resultMap.getCode()).body(resultMap);
        }

        CronJobInfo jobInfo = cronJobService.createCronJob(cronJob, user);
        return ResponseEntity.ok(new ResultMap(tokenUtils).successAndRefreshToken(request).payload(jobInfo));
    }


    /**
     * 更新 cron job
     *
     * @param id
     * @param cronJob
     * @param bindingResult
     * @param user
     * @param request
     * @return
     */
    @MethodLog
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity updateCronJob(@PathVariable Long id,
                                        @Valid @RequestBody CronJobUpdate cronJob,
                                        BindingResult bindingResult,
                                        @CurrentUser User user,
                                        HttpServletRequest request) {

        if (bindingResult.hasErrors()) {
            ResultMap resultMap = new ResultMap(tokenUtils).failAndRefreshToken(request).message(bindingResult.getFieldErrors().get(0).getDefaultMessage());
            return ResponseEntity.status(resultMap.getCode()).body(resultMap);
        }

        if (invalidId(id) || !cronJob.getId().equals(id)) {
            ResultMap resultMap = new ResultMap(tokenUtils).failAndRefreshToken(request).message("Invalid id");
            return ResponseEntity.status(resultMap.getCode()).body(resultMap);
        }

        cronJobService.updateCronJob(cronJob, user);
        return ResponseEntity.ok(new ResultMap(tokenUtils).successAndRefreshToken(request));
    }

    /**
     * 删除 cron job
     *
     * @param id
     * @param user
     * @param request
     * @return
     */
    @MethodLog
    @DeleteMapping("/{id}")
    public ResponseEntity deleteCronJob(@PathVariable Long id,
                                        @CurrentUser User user,
                                        HttpServletRequest request) {

        if (invalidId(id)) {
            ResultMap resultMap = new ResultMap(tokenUtils).failAndRefreshToken(request).message("Invalid id");
            return ResponseEntity.status(resultMap.getCode()).body(resultMap);
        }

        cronJobService.deleteCronJob(id, user);
        return ResponseEntity.ok(new ResultMap(tokenUtils).successAndRefreshToken(request));
    }


    /**
     * start job
     *
     * @param id
     * @param user
     * @param request
     * @return
     */
    @MethodLog
    @PostMapping("/start/{id}")
    public ResponseEntity startCronJob(@PathVariable Long id,
                                       @CurrentUser User user,
                                       HttpServletRequest request) {

        if (invalidId(id)) {
            ResultMap resultMap = new ResultMap(tokenUtils).failAndRefreshToken(request).message("Invalid id");
            return ResponseEntity.status(resultMap.getCode()).body(resultMap);
        }

        CronJob cronJob = cronJobService.startCronJob(id, user);
        return ResponseEntity.ok(new ResultMap(tokenUtils).successAndRefreshToken(request).payload(cronJob));
    }

    @MethodLog
    @PostMapping("/stop/{id}")
    public ResponseEntity stopCronJob(@PathVariable Long id,
                                      @CurrentUser User user,
                                      HttpServletRequest request) {

        if (invalidId(id)) {
            ResultMap resultMap = new ResultMap(tokenUtils).failAndRefreshToken(request).message("Invalid id");
            return ResponseEntity.status(resultMap.getCode()).body(resultMap);
        }

        CronJob cronJob = cronJobService.stopCronJob(id, user);
        return ResponseEntity.ok(new ResultMap(tokenUtils).successAndRefreshToken(request).payload(cronJob));
    }
}
