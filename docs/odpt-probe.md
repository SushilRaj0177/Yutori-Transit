(node:622) [UNDICI-EHPA] Warning: EnvHttpProxyAgent is experimental, expect them to change at any time.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:634) [UNDICI-EHPA] Warning: EnvHttpProxyAgent is experimental, expect them to change at any time.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:645) [UNDICI-EHPA] Warning: EnvHttpProxyAgent is experimental, expect them to change at any time.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:645) [UNDICI-EHPA] Warning: EnvHttpProxyAgent is experimental, expect them to change at any time.
(Use `node --trace-warnings ...` to show where the warning was created)
# ODPT probe — 2026-10-01T04:30:10.746Z

## standard (https://api.odpt.org/api/v4)

### odpt:Train odpt.Railway:TokyoMetro.Marunouchi
0 records

No per-car numeric arrays found.

### odpt:Train odpt.Railway:TokyoMetro.Ginza
0 records

No per-car numeric arrays found.

### odpt:TrainInformation odpt.Operator:TokyoMetro
10 records
- `@id` (10): "urn:uuid:75f026de-e9ac-4c4e-8b34-a5b0f8fb4b27"
- `@type` (10): "odpt:TrainInformation"
- `dc:date` (10): "2026-10-01T13:30:00+09:00"
- `@context` (10): "http://vocab.odpt.org/context_odpt_TrainInformation.jsonld"
- `dct:valid` (10): "2026-10-01T13:35:00+09:00"
- `owl:sameAs` (10): "odpt.TrainInformation:TokyoMetro.Ginza"
- `odpt:railway` (10): "odpt.Railway:TokyoMetro.Ginza"
- `odpt:operator` (10): "odpt.Operator:TokyoMetro"
- `odpt:trainInformationText` (10): {"en":"Normal service","ja":"現在、平常どおり運転しています。","ko":"정상 운행","zh-Hans":"通常运行","zh-Hant":"正常

### odpt:StationTimetable odpt.Station:TokyoMetro.Marunouchi.Shinjuku
4 records
- `@id` (4): "urn:ucode:_00001C00000000000001000003101062"
- `@type` (4): "odpt:StationTimetable"
- `dc:date` (4): "2026-09-24T08:00:00+09:00"
- `@context` (4): "http://vocab.odpt.org/context_odpt_StationTimetable.jsonld"
- `dct:issued` (4): "2026-09-19"
- `owl:sameAs` (4): "odpt.StationTimetable:TokyoMetro.Marunouchi.Shinjuku.TokyoMetro.Ikebukuro.SaturdayHoliday
- `odpt:railway` (4): "odpt.Railway:TokyoMetro.Marunouchi"
- `odpt:station` (4): "odpt.Station:TokyoMetro.Marunouchi.Shinjuku"
- `odpt:calendar` (4): "odpt.Calendar:SaturdayHoliday"
- `odpt:operator` (4): "odpt.Operator:TokyoMetro"
- `odpt:railDirection` (4): "odpt.RailDirection:TokyoMetro.Ikebukuro"
- `odpt:stationTimetableObject` (4): [{"odpt:train":"odpt.Train:TokyoMetro.Marunouchi.B427","odpt:isOrigin":true,"odpt:trainTyp

### odpt:StationFacility odpt.StationFacility:TokyoMetro.Otemachi
HTTP 404

### odpt:PassengerSurvey odpt.Operator:TokyoMetro
147 records
- `@id` (147): "urn:ucode:_00001C0000000000000100000320956C"
- `@type` (147): "odpt:PassengerSurvey"
- `dc:date` (147): "2026-07-03T14:00:00+09:00"
- `@context` (147): "http://vocab.odpt.org/context_odpt_PassengerSurvey.jsonld"
- `owl:sameAs` (147): "odpt.PassengerSurvey:TokyoMetro.Kinshicho"
- `odpt:railway` (147): ["odpt.Railway:TokyoMetro.Hanzomon"]
- `odpt:station` (147): ["odpt.Station:TokyoMetro.Hanzomon.Kinshicho"]
- `odpt:operator` (147): "odpt.Operator:TokyoMetro"
- `odpt:includeAlighting` (147): true
- `odpt:passengerSurveyObject` (147): [{"odpt:surveyYear":2020,"odpt:passengerJourneys":74337},{"odpt:surveyYear":2021,"odpt:pas

### odpt:Railway odpt.Operator:TokyoMetro
10 records
- `@id` (10): "urn:ucode:_00001C000000000000010000030C46AD"
- `@type` (10): "odpt:Railway"
- `dc:date` (10): "2024-06-27T08:00:00+09:00"
- `@context` (10): "http://vocab.odpt.org/context_odpt_Railway.jsonld"
- `dc:title` (10): "丸ノ内線"
- `odpt:color` (10): "#F62E36"
- `owl:sameAs` (10): "odpt.Railway:TokyoMetro.Marunouchi"
- `odpt:lineCode` (10): "M"
- `odpt:operator` (10): "odpt.Operator:TokyoMetro"
- `odpt:railwayTitle` (10): {"en":"Marunouchi Line","ja":"丸ノ内線","ko":"마루노우치선","zh-Hans":"丸之内线","zh-Hant":"丸之内線"}
- `odpt:stationOrder` (10): [{"odpt:index":1,"odpt:station":"odpt.Station:TokyoMetro.Marunouchi.Ogikubo","odpt:station
- `odpt:ascendingRailDirection` (10): "odpt.RailDirection:TokyoMetro.Ikebukuro"
- `odpt:descendingRailDirection` (10): "odpt.RailDirection:TokyoMetro.Ogikubo"

## challenge (https://api-challenge.odpt.org/api/v4)

### odpt:Train odpt.Railway:TokyoMetro.Marunouchi
0 records

No per-car numeric arrays found.

### odpt:Train odpt.Railway:TokyoMetro.Ginza
0 records

No per-car numeric arrays found.

### odpt:TrainInformation odpt.Operator:TokyoMetro
0 records

### odpt:StationTimetable odpt.Station:TokyoMetro.Marunouchi.Shinjuku
0 records

### odpt:StationFacility odpt.StationFacility:TokyoMetro.Otemachi
HTTP 404

### odpt:PassengerSurvey odpt.Operator:TokyoMetro
0 records

### odpt:Railway odpt.Operator:TokyoMetro
9 records
- `@id` (9): "urn:ucode:_00001C000000000000010000030C46B0"
- `@type` (9): "odpt:Railway"
- `dc:date` (9): "2026-07-03T15:00:00+09:00"
- `@context` (9): "http://vocab.odpt.org/context_odpt_Railway.jsonld"
- `dc:title` (9): "千代田線"
- `owl:sameAs` (9): "odpt.Railway:TokyoMetro.Chiyoda"
- `odpt:operator` (9): "odpt.Operator:TokyoMetro"
- `odpt:railwayTitle` (9): {"en":"Chiyoda Line","ja":"千代田線"}
- `odpt:stationOrder` (9): []

