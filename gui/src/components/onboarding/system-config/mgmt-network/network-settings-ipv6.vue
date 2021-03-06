/*
* CORTX-CSM: CORTX Management web and CLI interface.
* Copyright (c) 2020 Seagate Technology LLC and/or its Affiliates
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published
* by the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <https://www.gnu.org/licenses/>.
* For any questions about this software or licensing,
* please email opensource@seagate.com or cortx-questions@seagate.com.
*/
<template>
  <v-container class="mt-0 pt-0">
    <v-row>
      <v-col cols="6" class="mt-0 pt-0">
        <div class="body-2">
          <div class="title mt-0" id="lblIp6MNS">
            Management network settings: IPv6
          </div>
          <div class="mt-6" id="lblIPMsg">
            You need to configure a single IP address for management of this
            system.
          </div>
          <v-divider class="mt-2" />
          <div class="font-weight-bold mt-6">Source</div>
          <div class="mt-4">
            <input
              type="radio"
              name="source"
              value="manual"
              id="rbtnIp6Source"
            />
            <span class="ml-3 font-weight-bold">Manual</span>
            <input
              class="ml-10"
              type="radio"
              disabled
              name="DHCP"
              value="DHCP"
              id="rbtnIp6Source"
            />
            <span class="ml-3 font-weight-bold" id="lblIp6DHCP">DHCP</span>
          </div>
          <div class="mt-4">
            <span class="font-weight-bold" id="lblIp4Gateway">Gateway</span>
            <div>
              <input
                class="input-text"
                type="text"
                name="gateway"
                v-model="ipv6Gateway"
                id="txtIP6Gatway"
              />
            </div>
          </div>
          <div class="font-weight-bold mt-6" id="lblIp4StaticAddress">
            Static address
          </div>
          <v-divider class="mt-2" width="300" />
          <v-row v-for="(value, i) in staticIpList" :key="value + i">
            <v-col cols="6">{{ value }}</v-col>
            <v-col cols="3">
              <v-img
                @click="deleteIpAddress(value)"
                id="alert-img"
                :src="require('./../../../../assets/actions/delete-green.svg')"
                width="1em"
                height="1em"
              ></v-img>
            </v-col>
          </v-row>
          <div class="mt-4">
            <span class="font-weight-bold" id="lblIp6Adress">IP address</span>
            <div>
              <input
                class="input-text"
                v-model="newAddress"
                type="text"
                name="staticIpList"
                id="txtIP6Ipaddress"
              />
            </div>
          </div>
          <div
            :class="[
              $data.staticIpList.length < 4
                ? 'csmprimary--text'
                : 'grey--text lighten-1',
              'pointer',
              'mt-8'
            ]"
            @click="addIpAddress(newAddress)"
          >
            + Add another static address (maximum of 4)
          </div>
        </div>
      </v-col>
    </v-row>
    <span class="d-none">{{ isValidForm }}</span>
  </v-container>
</template>
<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import {
  SystemConfigObject,
  Ipv6
} from "./../../../../models/system-configuration";
import { EVENT_BUS } from "./../../../../main";

@Component({
  name: "cortx-network-settings-ipv4"
})
export default class CortxNetworkSettingsIpv4 extends Vue {
  private data() {
    return {
      source: "manual",
      staticIpList: [],
      newAddress: "",
      ipv6Gateway: ""
    };
  }
  private gotoNextPage() {
    this.updateIpv6Config();
    this.$router.push("dataconfig1");
  }
  private mounted() {
    this.managementNetworkGetter();
    // WizardHook: Open a listener for onNext event
    // So when wizard footer clicks on the Next Button this component can perform its own workflow
    EVENT_BUS.$on("emitOnNext", (res: any) => {
      this.updateIpv6Config().then(result => {
        res(true);
      });
    });
  }
  private destroyed() {
    // WizardHook: shut off on exit event listner
    EVENT_BUS.$off("emitOnNext");
  }
  get isValidForm() {
    const validate = true;
    // WizardHook: Emit event to sibling wizard footer component
    // to send information about data validation to enable/disable wizard footer
    EVENT_BUS.$emit("validForm", validate);
    return validate;
  }
  private managementNetworkGetter(): any {
    const systemconfig = this.$store.getters["systemConfig/systemconfig"];
    if (
      systemconfig.management_network_settings &&
      systemconfig.management_network_settings.ipv6
    ) {
      this.$data.ipv6Gateway =
        systemconfig.management_network_settings.ipv6.gateway;
      this.$data.staticIpList =
        systemconfig.management_network_settings.ipv6.ip_address;
    }
  }
  private updateIpv6Config() {
    const queryParams: Ipv6 = {
      is_dhcp: false,
      ip_address: this.$data.staticIpList,
      gateway: this.$data.ipv6Gateway,
      address_label: "vlan",
      type: ""
    };

    return this.$store.dispatch("systemConfig/updateMngmtIpv6", queryParams);
  }

  private addIpAddress(address: string) {
    if (
      this.$data.staticIpList.length < 4 &&
      address !== "" &&
      address !== undefined
    ) {
      this.$data.staticIpList.push(address);
      this.$data.newAddress = "";
    }
  }
  private gotToPrevPage() {
    if (this.$store.getters["systemConfig/isipV4Status"] === true) {
      this.$router.push("systemconfig2");
    } else {
      this.$router.push("systemconfig1");
    }
  }
  private deleteIpAddress(address: string) {
    for (
      let addressIndex = 0;
      addressIndex < this.$data.staticIpList.length;
      addressIndex++
    ) {
      if (this.$data.staticIpList[addressIndex] === address) {
        this.$data.staticIpList.splice(addressIndex, 1);
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.input-text {
  border-style: solid;
  border-width: 1px;
  border-color: #e3e3e3;
  width: 20em;
  height: 2.5em;
}
.pointer {
  cursor: pointer;
}
</style>
