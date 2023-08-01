import React, { useEffect, useState } from "react";
import SubmissionEditing from "./SubmissionEditing";
import { api, store } from "../../lib";
import { getTranslation } from "../../util";
import { isEqual, flatten } from "lodash";
import { useNotification } from "../../util/hooks";

const BatchDetail = ({ expanded, setReload }) => {
  const [dataLoading, setDataLoading] = useState(null);
  const [saving, setSaving] = useState(null);
  const [rawValues, setRawValues] = useState([]);
  const { notify } = useNotification();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "submission");

  useEffect(() => {
    api
      .get(`/form-pending-data-batch/${expanded.id}`)
      .then((res) => {
        setRawValues(
          res.data.map((x) => ({
            key: x.id,
            data: [],
            loading: false,
            ...x,
          }))
        );
      })
      .catch((e) => {
        console.error(e);
      });
  }, [expanded]);

  const fetchData = (recordId, questionGroups) => {
    setDataLoading(recordId);
    api
      .get(`pending-data/${recordId}?lang=${activeLang}`)
      .then((res) => {
        const data = questionGroups.map((qg) => {
          return {
            ...qg,
            question: qg.question.map((q) => {
              const findValue = res.data.find(
                (d) => d.question === q.id
              )?.value;
              const qname =
                activeLang === "en"
                  ? q.name
                  : q?.translations?.find((ts) => ts?.language === activeLang)
                      ?.name || q?.name;
              return {
                ...q,
                name: qname,
                value: findValue || findValue === 0 ? findValue : null,
                history:
                  res.data.find((d) => d.question === q.id)?.history || false,
              };
            }),
          };
        });
        setRawValues((rv) =>
          rv.map((rI) =>
            rI.id === recordId ? { ...rI, data, loading: false } : rI
          )
        );
      })
      .catch((e) => {
        console.error(e);
        setRawValues((rv) =>
          rv.map((rI) => (rI.id === recordId ? { ...rI, loading: false } : rI))
        );
      })
      .finally(() => {
        setDataLoading(null);
      });
  };

  const handleSave = (data) => {
    setSaving(data.id);
    const formData = [];
    data.data.map((rd) => {
      rd.question.map((rq) => {
        if (
          (rq.newValue || rq.newValue === 0) &&
          !isEqual(rq.value, rq.newValue)
        ) {
          let value = rq.newValue;
          if (rq.type === "number") {
            value =
              parseFloat(value) % 1 !== 0 ? parseFloat(value) : parseInt(value);
          }
          formData.push({
            question: rq.id,
            value: value,
          });
        }
      });
    });
    api
      .put(
        `form-pending-data/${record.form?.id}?pending_data_id=${data.id}`,
        formData
      )
      .then(() => {
        fetchData(data.id, questionGroups);
        setReload(data.id);
        notify({
          type: "success",
          message: "Data updated",
        });
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        setSaving(null);
      });
  };

  const updateCell = (key, parentId, value) => {
    let prev = JSON.parse(JSON.stringify(rawValues));
    prev = prev.map((rI) => {
      let hasEdits = false;
      const data = rI.data.map((rd) => ({
        ...rd,
        question: rd.question.map((rq) => {
          if (rq.id === key && rI.id === parentId) {
            if (
              isEqual(rq.value, value) &&
              (rq.newValue || rq.newValue === 0)
            ) {
              delete rq.newValue;
            } else {
              rq.newValue = value;
            }
            const edited = !isEqual(rq.value, value);
            if (edited && !hasEdits) {
              hasEdits = true;
            }
            return rq;
          }
          if (
            (rq.newValue || rq.newValue === 0) &&
            !isEqual(rq.value, rq.newValue) &&
            !hasEdits
          ) {
            hasEdits = true;
          }
          return rq;
        }),
      }));
      return {
        ...rI,
        data,
        edited: hasEdits,
      };
    });
    setRawValues(prev);
  };

  const resetCell = (key, parentId) => {
    let prev = JSON.parse(JSON.stringify(rawValues));
    prev = prev.map((rI) => {
      let hasEdits = false;
      const data = rI.data.map((rd) => ({
        ...rd,
        question: rd.question.map((rq) => {
          if (rq.id === key && rI.id === parentId) {
            delete rq.newValue;
            return rq;
          }
          if (
            (rq.newValue || rq.newValue === 0) &&
            !isEqual(rq.value, rq.newValue) &&
            !hasEdits
          ) {
            hasEdits = true;
          }
          return rq;
        }),
      }));
      return {
        ...rI,
        data,
        edited: hasEdits,
      };
    });
    setRawValues(prev);
  };

  const isEdited = (id) => {
    return (
      !!flatten(
        rawValues.find((d) => d.id === id)?.data?.map((g) => g.question)
      )?.filter(
        (d) => (d.newValue || d.newValue === 0) && !isEqual(d.value, d.newValue)
      )?.length || false
    );
  };

  return (
    <SubmissionEditing
      expanded={expanded}
      updateCell={updateCell}
      resetCell={resetCell}
      handleSave={handleSave}
      saving={saving}
      dataLoading={dataLoading}
      isEdited={isEdited}
      isEditable={true}
      text={text}
    />
  );
};

export default BatchDetail;
