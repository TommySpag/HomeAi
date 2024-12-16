import { observer } from "mobx-react-lite";
import React, { useEffect, useState, FC } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Dimensions, ScrollView, ViewStyle } from "react-native";
import { GestureHandlerRootView, PanGestureHandler } from "react-native-gesture-handler";
import * as api from "../api/generated-client/api";
import { GraphBar as GraphPriceBySize, GraphBar as GraphPriceByBed, GraphLine } from "@/components/Graphs";
import { Screen } from "../components";
import { useAppTheme } from "@/utils/useAppTheme";
import type { ThemedStyle } from "@/theme";

// Type pour les données de chaque maison
type Data = {
  brokered_by: string;
  status: string;
  price: number;
  bed: number;
  bath: number;
  acre_lot: number;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  house_size: number;
  prev_sold_date: number;
};

export const StatisticScreen: FC<any> = observer(function StatisticScreen(_props) {
  const screenWidth = Dimensions.get("window").width;
  const [priceBySize, setPriceBySize] = useState<Data[] | any>();
  const [avgPriceByBed, setAvgPriceByBed] = useState<Data[] | any>();
  const [salesByYear, setSalesByYear] = useState<Data[] | any>();
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndexSize, setCurrentIndexSize] = useState<number>(0);
  const [currentIndexBed, setCurrentIndexBed] = useState<number>(0);
  const [currentIndexYear, setCurrentIndexYear] = useState<number>(0);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    }
    return num.toString();
  };

  const handleSwipe = (
    direction: "left" | "right",
    setIndex: React.Dispatch<React.SetStateAction<number>>,
    dataLength: number,
  ) => {
    setIndex((prevIndex) => {
      if (direction === "left") {
        return Math.max(prevIndex - 5, 0);
      } else {
        return Math.min(prevIndex + 5, dataLength - 5);
      }
    });
  };

  const setChartDataSize = () => {
    if (!priceBySize) return { labels: [], datasets: [] };
    const currentData = priceBySize.slice(0, 3);
    return {
      labels: currentData.map((e) => `${formatNumber(e.min)} - ${formatNumber(e.max)} houses`),
      datasets: [
        {
          data: currentData.map((e) => e.count),
        },
      ],
    };
  };

  const setChartDataBed = () => {
    if (!avgPriceByBed) return { labels: [], datasets: [] };
    const currentData = avgPriceByBed.slice(currentIndexBed, currentIndexBed + 5);
    return {
      labels: currentData.map((e: any) => `${e.bed} bed`),
      datasets: [
        {
          data: currentData.map((e: any) => e.averagePrice),
        },
      ],
    };
  };

  const setChartDataYear = () => {
    if (!salesByYear) return { labels: [], datasets: [] };
    const currentData = salesByYear.slice(currentIndexYear, currentIndexYear + 5);
    return {
      labels: currentData.map((e: any) => `${e.year} year`),
      datasets: [
        {
          data: currentData.map((e: any) => e.count),
        },
      ],
    };
  };

  const fetchData = async () => {
    try {
      const client = new api.HistoricDataApi();
      const resPriceBySize = await client.historyPropertiesCountBySizeGet();
      const resAvgPriceByBed = await client.historyAveragePriceByBedroomsGet();
      const resSalesByYear = await client.historySalesByYearGet();

      setPriceBySize(resPriceBySize.data);
      setAvgPriceByBed(resAvgPriceByBed.data);
      setSalesByYear(resSalesByYear.data);

      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des données :", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const {
    themed,
    theme: { colors },
  } = useAppTheme();

  return (
    <Screen preset="scroll" contentContainerStyle={themed($screenContentContainer)}>
      <GestureHandlerRootView style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#FFD700" />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollViewContainer}>
            <Text style={styles.title}>Prix des maisons par taille en ft²</Text>
            <PanGestureHandler
              onGestureEvent={(event) => {
                const { translationX } = event.nativeEvent;
                if (translationX > 100) {
                  handleSwipe("right", setCurrentIndexSize, priceBySize?.length ?? 0);
                } else if (translationX < -100) {
                  handleSwipe("left", setCurrentIndexSize, priceBySize?.length ?? 0);
                }
              }}
            >
              <View>
                <GraphPriceBySize data={setChartDataSize()} screenWidth={screenWidth} />
              </View>
            </PanGestureHandler>

            <Text style={styles.title}>Moyenne du prix des maisons par nombre de chambres</Text>
            <PanGestureHandler
              onGestureEvent={(event) => {
                const { translationX } = event.nativeEvent;
                if (translationX > 100) {
                  handleSwipe("right", setCurrentIndexBed, avgPriceByBed?.length ?? 0);
                } else if (translationX < -100) {
                  handleSwipe("left", setCurrentIndexBed, avgPriceByBed?.length ?? 0);
                }
              }}
            >
              <View>
                <GraphPriceByBed data={setChartDataBed()} screenWidth={screenWidth} />
              </View>
            </PanGestureHandler>

            <Text style={styles.title}>Moyenne du prix des maisons par ans</Text>
            <PanGestureHandler
              onGestureEvent={(event) => {
                const { translationX } = event.nativeEvent;
                if (translationX > 100) {
                  handleSwipe("right", setCurrentIndexYear, salesByYear?.length ?? 0);
                } else if (translationX < -100) {
                  handleSwipe("left", setCurrentIndexYear, salesByYear?.length ?? 0);
                }
              }}
            >
              <View >
                <GraphLine data={setChartDataYear()} screenWidth={screenWidth} />
              </View>
            </PanGestureHandler>
          </ScrollView>
        )}
      </GestureHandlerRootView>
    </Screen>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    flex: 1,
    padding: 15,
  },
  scrollViewContainer: {
    alignItems: "center",
  },
  title: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
});

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xxl,
});
