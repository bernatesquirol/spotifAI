
import React from 'react';
import { Stage, Container, Rect, Text } from "react-konva";
import Konva from 'konva';
const Track = ({ x,y,name }) => (
    <Text
        x={x}
        y={y}
        text={name}
    />
    
);

export default Track;