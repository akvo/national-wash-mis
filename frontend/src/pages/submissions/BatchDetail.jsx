import React, { useEffect, useState } from "react";
import SubmissionEditing from "./SubmissionEditing";
import { api, store } from "../../lib";
import { getTranslation } from "../../util";
import { isEqual, flatten } from "lodash";
import { useNotification } from "../../util/hooks";

const BatchDetail = ({ expanded, setReload }) => {
  const [dataLoading, setDataLoading] = useState(null);
  const [saving, setSaving] = useState(null);
  const [rawValue, setRawValue] = useState(null);
  const { notify } = useNotification();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = getTranslation(activeLang, "submission");

  const questionGroups = window.forms.find((f) => f.id === expanded.form)
    ?.content?.question_group;

  useEffect(() => {
    if (questionGroups) {
      setDataLoading(expanded.id);
      api
        .get(`pending-data/${expanded.id}?lang=${activeLang}`)
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
          setRawValue({ ...expanded, data, loading: false });
        })
        .catch((e) => {
          console.error(e);
          setRawValue({ ...expanded, data: [], loading: false });
        })
        .finally(() => {
          setDataLoading(null);
        });
    }
  }, [expanded, activeLang, questionGroups]);

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
        `form-pending-data/${expanded.form?.id}?pending_data_id=${data.id}`,
        formData
      )
      .then(() => {
        // fetchData(data.id);
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
    let hasEdits = false;
    const data = rawValue.data.map((rd) => ({
      ...rd,
      question: rd.question.map((rq) => {
        if (rq.id === key && expanded.id === parentId) {
          if (isEqual(rq.value, value) && (rq.newValue || rq.newValue === 0)) {
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
    setRawValue({
      ...rawValue,
      data,
      edited: hasEdits,
    });
  };

  const resetCell = (key, parentId) => {
    const prev = JSON.parse(JSON.stringify(rawValue));
    let hasEdits = false;
    const data = prev.data.map((rd) => ({
      ...rd,
      question: rd.question.map((rq) => {
        if (rq.id === key && expanded.id === parentId) {
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
    setRawValue({
      ...prev,
      data,
      edited: hasEdits,
    });
  };

  const isEdited = () => {
    return (
      !!flatten(rawValue?.data?.map((g) => g.question))?.filter(
        (d) => (d.newValue || d.newValue === 0) && !isEqual(d.value, d.newValue)
      )?.length || false
    );
  };

  if (!rawValue) {
    return <div>Loading...</div>;
  }

  return (
    <SubmissionEditing
      expanded={rawValue}
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
