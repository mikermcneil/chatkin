# Notes on react native


+ `height` doesn't work for `<ScrollView>` (at least not on iOS in any of the situations we tested, including where the parent has flex: 1 and where the parent has a fixed height). To work around this, you can wrap them in a `<View>` with a set `height` or `flex`.
