            <Table borderStyle={{borderWidth: 1, borderColor: '#C1C0B9'}}>
            <Row data={settings_sensors_table.tableHead} widthArr={settings_main_table.widthArr} style={styles.header} textStyle={styles.text}/>
            </Table>
            <Table borderStyle={{borderWidth: 1, borderColor: '#C1C0B9'}}>
                {
                tableData.map((rowData, index) => (
                    <Col
                        key={index}
                        data={rowData}
                        heightArr={20}
                        style={[styles.row, index%2 && {backgroundColor: '#F7F6E7'}],checkColors(index)}
                        textStyle={styles.text}
                    />
                ))
                }
            </Table>

                <Table borderStyle={{borderWidth: 1, borderColor: '#C1C0B9'}}>
                    <Row data={settings_apps_table.tableHead} widthArr={settings_main_table.widthArr} style={styles.header} textStyle={styles.text}/>
                </Table>