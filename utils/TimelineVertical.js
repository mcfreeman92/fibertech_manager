import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';

import { useTranslation } from '@/components/hooks/useTranslation';

const TimelineVertical = ({
    data,
    circleSize = 15,
    lineWidth = 2,
    circleColor = '#007AFF',
    lineColor = '#E5E5EA',
    textColor = '#000000',
    dateColor = '#8E8E93',
    backgroundColor = '#FFFFFF',
    onItemPress,
    renderCustomCircle,
    renderCustomContent,
}) => {
    const renderCircle = (item, index, isLast) => {
        if (renderCustomCircle) {
            return renderCustomCircle(item, index, isLast);
        }

        return (
            <View
                style={[
                    styles.circle,
                    {
                        width: circleSize,
                        height: circleSize,
                        borderRadius: circleSize / 2,
                        backgroundColor: circleColor,
                        borderColor: circleColor,
                    },
                ]}
            >
                {item.icon && (
                    <View style={styles.iconContainer}>
                        {item.icon}
                    </View>
                )}
            </View>
        );
    };

    const { t } = useTranslation();

    const renderContent = (item, index) => {
        if (renderCustomContent) {
            return renderCustomContent(item, index);
        }

        const { from } = item;
        const { through } = item;

        return (
            <View style={styles.contentContainer}>
                <Text style={[styles.title, { color: textColor }]}>
                    {from.unitLabel}
                </Text>
                <Text style={[styles.description, { color: textColor }]}>
                    {`${t('port')}: ${from.port} ➡️​ ${from.deviceLabel}`}
                </Text>
                <Text style={[styles.description, { color: textColor }]}>
                    {`${t('thread')}: ${through.thread} ${t('fiber')} ➡️​​ ${through.fiberLabel}`}
                </Text>
                <View style={{ flexDirection: 'row', gap: 5 }}>
                    <Text style={[styles.label, { color: textColor }]}>
                        {`${t('Link')}`}
                    </Text>
                    <Text style={[styles.description, { color: textColor }]}>
                        {`${t('port')} ${from.port} ➡️​ ${from.deviceLabel}`}
                    </Text>
                </View>

            </View>
        );
    };

    const renderItem = (item, index) => {
        const isLast = index === data.length - 1;

        return (
            <View key={index} style={styles.itemWrapper}>
                {/* Contenedor de línea y círculo */}
                <View style={styles.timelineMarkerContainer}>
                    {/* Círculo - posicionado absolutamente en la parte superior */}
                    {renderCircle(item, index, isLast)}

                    {/* Línea vertical (excepto para el último item) */}
                    {!isLast && (
                        <View
                            style={[
                                styles.connectorLine,
                                {
                                    width: lineWidth,
                                    backgroundColor: lineColor,
                                    top: circleSize, // Comienza después del círculo
                                },
                            ]}
                        />
                    )}
                </View>

                {/* Contenido */}
                <TouchableOpacity
                    style={styles.contentTouchable}
                    onPress={() => onItemPress && onItemPress(item, index)}
                    activeOpacity={onItemPress ? 0.7 : 1}
                >
                    {renderContent(item, index)}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor }]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
            {data.map((item, index) => renderItem(item, index))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 8,
    },
    itemWrapper: {
        flexDirection: 'row',
        minHeight: 80,
    },
    timelineMarkerContainer: {
        width: 50,
        alignItems: 'center',
        paddingLeft: 16,
        position: 'relative', // Importante para el posicionamiento absoluto de los hijos
    },
    circle: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        position: 'absolute', // Posición absoluta

        top: 0, // Anclado al inicio
        zIndex: 2,
    },
    connectorLine: {
        position: 'absolute', // Posición absoluta
        bottom: 0, // Se extiende hasta abajo
        zIndex: 1,
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentTouchable: {
        flex: 1,
        paddingVertical: 12,
        paddingRight: 16,
        marginLeft: 8,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    description: {
        fontSize: 16,
        fontWeight: '400',
        marginBottom: 4,
        lineHeight: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        lineHeight: 20,
    },
    date: {
        fontSize: 12,
        fontWeight: '400',
        marginTop: 2,
    },
});

export default TimelineVertical;