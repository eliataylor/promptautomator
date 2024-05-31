import React from 'react';
import {useSourceData} from "../SourceDataContext"; // Make sure to import the CSS file
import { renderObject } from "../utils";

interface SurveyProps {
  surveyId: string;
}

const Survey: React.FC<SurveyProps> = ({ surveyId }) => {
  const {surveys} = useSourceData();
  if (typeof surveys[surveyId] === 'undefined') return null;

  return renderObject(surveys[surveyId])
};

export default Survey;
