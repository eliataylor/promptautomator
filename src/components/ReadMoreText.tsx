import React, {useRef, useState} from 'react';
import {Typography} from '@mui/material';
import '../theme/styles.css';
import {useSourceData} from "../SourceDataContext"; // Make sure to import the CSS file

interface ReadMoreTextProps {
  text: string;
  maxLength: number;
}

const ReadMoreText: React.FC<ReadMoreTextProps> = ({ text,  }) => {
  const {maxStrLength} = useSourceData();

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const textContainerRef = useRef<HTMLDivElement>(null);


  const toggleReadMore = (): void => {
    setIsExpanded(!isExpanded);
  };

  const displayedText = text.length <= maxStrLength ? text : text.slice(0, maxStrLength);

  return (
    <Typography variant="body1" component="div">
      {displayedText}
      {text.length > maxStrLength && (
        <React.Fragment>
          {!isExpanded && '...'}
          <div
            ref={textContainerRef}
            className={`textContainer ${isExpanded ? 'expanded' : ''}`}
          >
            <span>{text.slice(maxStrLength)}</span>
          </div>
          <small
            onClick={toggleReadMore}
            style={{
              marginLeft: 8,
              fontSize: '70%',
              color: '#1e7fc1',
              cursor: 'pointer',
            }}
          >
            {isExpanded ? 'Read Less' : 'Read More'}
          </small>
        </React.Fragment>
      )}
    </Typography>
  );
};

export default ReadMoreText;
