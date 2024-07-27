import React from "react";
import { Text, StyleSheet, View } from "@react-pdf/renderer";

const ReturnPdfText = ({ text }) => {
  // Split the input text into lines
  const lines = text.split('\n');

  return (
    <View>
      {lines.map((line, lineIndex) => {
        // Split each line into words
        const words = line.split(/(\b\w+\b|\S)/);

        // Process words in each line
        const bionicLine = words.map((word, wordIndex) => {
          const wordLength = word.length;
          const midPoint = Math.floor(wordLength / 2);

          const firstHalf = word.substring(0, midPoint);
          const secondHalf = word.substring(midPoint);

          return (
            <Text key={`${lineIndex}-${wordIndex}`}>
              <Text style={styles.textbold}>{firstHalf}</Text>
              <Text style={styles.text}>{secondHalf}</Text>
            </Text>
          );
        });

        // Return each line wrapped in its own Text component
        return (
          <Text key={lineIndex} style={styles.text}>
            {bionicLine}
            {lineIndex < lines.length - 1 && '\n'}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    fontFamily: "Times-Roman",
    textAlign: "justify",
  },
  textbold: {
    fontSize: 14,
    fontFamily: "Times-Bold",
    textAlign: "justify",
  },
});

export default ReturnPdfText;
